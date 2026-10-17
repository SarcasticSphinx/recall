import { cloudinaryImageUrl, type RichNode } from "./rich-content.ts";
export type ImagePurpose = "deck" | "question" | "answer";
export type PendingImage = { file: File; uploadedUrl?: string };
export function validateImageFile(file: Pick<File, "type" | "size">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Choose an image under 5 MB.");
}
export function imageSources(document?: RichNode | null): string[] {
  if (!document) return [];
  const sources =
    document.type === "image" && typeof document.attrs?.src === "string"
      ? [document.attrs.src]
      : [];
  return [
    ...new Set([
      ...sources,
      ...(document.content?.flatMap(imageSources) || []),
    ]),
  ];
}
export function mapImageSources(
  document: RichNode,
  replacements: Map<string, string>,
): RichNode {
  const next = structuredClone(document);
  function visit(node: RichNode) {
    const src = node.type === "image" ? node.attrs?.src : undefined;
    if (typeof src === "string" && replacements.has(src))
      node.attrs = { ...node.attrs, src: replacements.get(src)! };
    node.content?.forEach(visit);
  }
  visit(next);
  return next;
}
/** Validate text/structure before incurring any upload. Only our own staged URLs qualify. */
export function documentForValidation(
  document: RichNode | null,
  pending: Map<string, PendingImage>,
) {
  if (!document) return null;
  const replacements = new Map<string, string>();
  for (const src of imageSources(document))
    if (src.startsWith("blob:")) {
      if (!pending.has(src))
        throw new Error("Choose this image again before saving.");
      replacements.set(
        src,
        "https://res.cloudinary.com/recall/image/upload/pending.png",
      );
    }
  return mapImageSources(document, replacements);
}
export async function resolveImageSource(
  src: string,
  pending: Map<string, PendingImage>,
  upload: (file: File) => Promise<string>,
): Promise<string> {
  const entry = pending.get(src);
  if (!entry) {
    if (src.startsWith("blob:"))
      throw new Error("Choose this image again before saving.");
    return cloudinaryImageUrl.parse(src);
  }
  if (!entry.uploadedUrl)
    entry.uploadedUrl = cloudinaryImageUrl.parse(await upload(entry.file));
  return entry.uploadedUrl;
}
export async function resolveImageDocument(
  document: RichNode | null,
  pending: Map<string, PendingImage>,
  upload: (file: File) => Promise<string>,
) {
  if (!document) return null;
  const replacements = new Map<string, string>();
  for (const src of imageSources(document))
    replacements.set(src, await resolveImageSource(src, pending, upload));
  return mapImageSources(document, replacements);
}
