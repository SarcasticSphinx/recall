import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";
import { getAuth, isAuthConfigured } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudinaryClient, hasCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
const maxBytes = 5 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const origin = new URL(process.env.BETTER_AUTH_URL || request.url).origin;
    if (request.headers.get("origin") !== origin)
      return Response.json(
        { message: "Request origin is not allowed." },
        { status: 403 },
      );
    if (!isAuthConfigured())
      return Response.json(
        { message: "Sign in to upload images." },
        { status: 401 },
      );
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session)
      return Response.json(
        { message: "Sign in to upload images." },
        { status: 401 },
      );
    if (!hasCloudinary())
      return Response.json(
        { message: "Cloudinary image uploads are not configured yet." },
        { status: 503 },
      );
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > maxBytes + 100000)
      return Response.json(
        { message: "Choose an image under 5 MB." },
        { status: 413 },
      );
    // Bound the multipart stream even if Content-Length is absent or incorrect.
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ message: "Choose an image." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes + 100000) {
        await reader.cancel();
        return Response.json(
          { message: "Choose an image under 5 MB." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);
    const form = await new Response(buffer, {
      headers: { "content-type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    const purpose = form.get("purpose");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > maxBytes ||
      !["deck", "question", "answer"].includes(String(purpose))
    )
      return Response.json(
        { message: "Choose a valid image under 5 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(bytes);
    if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime))
      return Response.json(
        { message: "Use a JPEG, PNG, or WebP image." },
        { status: 400 },
      );
    // A successful attempt reserves a per-user slot before contacting the provider.
    const limit = await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${session.user.id} FOR UPDATE`;
      const count = await tx.imageUpload.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });
      if (count >= 30) return false;
      await tx.imageUpload.create({ data: { userId: session.user.id } });
      return true;
    });
    if (!limit)
      return Response.json(
        { message: "You've reached the hourly upload limit. Try again later." },
        { status: 429 },
      );
    const result = await new Promise<import("cloudinary").UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinaryClient().uploader.upload_stream(
          {
            resource_type: "image",
            folder: `recall/${session.user.id}`,
            public_id: randomUUID(),
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 1600, height: 1600, crop: "limit" }],
          },
          (error, result) =>
            error || !result
              ? reject(error || new Error("Upload failed"))
              : resolve(result),
        );
        stream.end(bytes);
      },
    );
    return Response.json(
      { url: result.secure_url, width: result.width, height: result.height },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Image upload failed");
    return Response.json(
      { message: "The image could not be uploaded. Please try again." },
      { status: 500 },
    );
  }
}
