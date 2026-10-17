import { getAuth, isAuthConfigured } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasOpenRouter, completeWithOpenRouter } from "@/lib/ai/openrouter";
import {
  notesSchema,
  parseDrafts,
  draftMessages,
  draftResponseFormat,
} from "@/lib/ai/drafts";
export const runtime = "nodejs";
export const maxDuration = 45;
export async function POST(request: Request) {
  try {
    if (
      request.headers.get("origin") !==
      new URL(process.env.BETTER_AUTH_URL || request.url).origin
    )
      return Response.json(
        { message: "Request origin is not allowed." },
        { status: 403 },
      );
    if (!isAuthConfigured())
      return Response.json(
        { message: "Sign in to create AI drafts." },
        { status: 401 },
      );
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session)
      return Response.json(
        { message: "Sign in to create AI drafts." },
        { status: 401 },
      );
    if (!hasOpenRouter())
      return Response.json(
        {
          message:
            "OpenRouter is not configured yet. Your notes have been kept.",
        },
        { status: 503 },
      );
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json(
        { message: "Add your notes first." },
        { status: 400 },
      );
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 60000) {
        await reader.cancel();
        return Response.json(
          { message: "These notes are too long." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return Response.json({ message: "Invalid request." }, { status: 400 });
    }
    const parsed = notesSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { message: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const { notes, deckId } = parsed.data;
    const db = getDb();
    if (
      !(await db.deck.findFirst({
        where: { id: deckId, userId: session.user.id },
        select: { id: true },
      }))
    )
      return Response.json({ message: "Deck not found." }, { status: 404 });
    const reservation = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${session.user.id} FOR UPDATE`;
      const count = await tx.aiRequest.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      });
      if (count >= 5) return null;
      return tx.aiRequest.create({
        data: { userId: session.user.id, notes },
        select: { id: true },
      });
    });
    if (!reservation)
      return Response.json(
        {
          message:
            "You've used your 5 AI requests for the last 24 hours. Try again later.",
        },
        { status: 429 },
      );
    // Attempts count even when the upstream fails: never automatically retry a potentially billable call.
    const output = await completeWithOpenRouter(
      draftMessages(notes),
      draftResponseFormat,
    );
    const cards = parseDrafts(output);
    return Response.json(
      { cards, sourceRequestId: reservation.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("AI draft generation failed");
    return Response.json(
      {
        message:
          "AI couldn't create drafts. Your notes are still here. Check the model setup or try again later.",
      },
      { status: 502 },
    );
  }
}
