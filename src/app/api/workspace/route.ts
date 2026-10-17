import { getAuth, isAuthConfigured } from "@/lib/auth";
import { actionSchema } from "@/lib/validation";
import {
  applyAction,
  loadWorkspace,
  WorkspaceError,
} from "@/lib/workspace-server";

export const runtime = "nodejs";

async function userId(request: Request) {
  if (!isAuthConfigured())
    throw new WorkspaceError(
      "Google sign-in has not been configured yet.",
      503,
    );
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    throw new WorkspaceError("Sign in to access your workspace.", 401);
  return session.user.id;
}
function errorResponse(error: unknown) {
  if (error instanceof WorkspaceError)
    return Response.json({ message: error.message }, { status: error.status });
  console.error(
    "Workspace request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    {
      message: "Your workspace could not be saved or loaded. Please try again.",
    },
    { status: 500 },
  );
}
export async function GET(request: Request) {
  try {
    return Response.json(await loadWorkspace(await userId(request)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    // Cookie-authenticated mutations must originate from this app.
    const expected = new URL(process.env.BETTER_AUTH_URL || request.url).origin;
    if (request.headers.get("origin") !== expected)
      throw new WorkspaceError("Request origin is not allowed.", 403);
    const id = await userId(request);
    const raw = await request.text();
    if (raw.length > 20000)
      throw new WorkspaceError("This request is too large.", 413);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new WorkspaceError("Invalid request body.");
    }
    const action = actionSchema.safeParse(body);
    if (!action.success)
      throw new WorkspaceError(
        action.error.issues[0]?.message || "Invalid request.",
      );
    await applyAction(id, action.data);
    return Response.json(await loadWorkspace(id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
