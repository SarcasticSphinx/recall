import { z } from "zod";
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | boolean | null>;
  marks?: { type: string; attrs?: Record<string, string | null> }[];
  content?: RichNode[];
};
export const cloudinaryImageUrl = z
  .string()
  .url()
  .max(2000)
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /\/image\/upload\//.test(url.pathname) &&
      !url.username &&
      !url.password
    );
  }, "Use an uploaded Cloudinary image.");
const safeLink = z
  .string()
  .max(2000)
  .refine(
    (value) => /^(https?:\/\/|mailto:)/i.test(value),
    "Use an HTTPS, HTTP, or email link.",
  );
const nodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.object({
    type: z.enum([
      "doc",
      "paragraph",
      "text",
      "heading",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "codeBlock",
      "hardBreak",
      "horizontalRule",
      "image",
    ]),
    text: z.string().max(10000).optional(),
    attrs: z
      .object({
        level: z.number().int().min(1).max(3).optional(),
        start: z.number().int().min(1).max(10000).optional(),
        src: cloudinaryImageUrl.optional(),
        alt: z.string().max(200).nullable().optional(),
        title: z.string().max(200).nullable().optional(),
        language: z.string().max(40).nullable().optional(),
      })
      .optional(),
    marks: z
      .array(
        z.object({
          type: z.enum([
            "bold",
            "italic",
            "strike",
            "code",
            "underline",
            "link",
          ]),
          attrs: z
            .object({
              href: safeLink.optional(),
              target: z.enum(["_blank", "_self"]).nullable().optional(),
              rel: z.string().max(100).nullable().optional(),
              class: z.string().max(100).nullable().optional(),
            })
            .optional(),
        }),
      )
      .max(6)
      .optional(),
    content: z.array(nodeSchema).max(300).optional(),
  }),
);
function bounded(value: unknown): boolean {
  const stack: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let count = 0;
  while (stack.length) {
    const item = stack.pop()!;
    if (
      ++count > 800 ||
      item.depth > 12 ||
      !item.value ||
      typeof item.value !== "object"
    )
      return false;
    const content = (item.value as RichNode).content;
    if (content !== undefined) {
      if (!Array.isArray(content)) return false;
      for (const child of content)
        stack.push({ value: child, depth: item.depth + 1 });
    }
  }
  return true;
}
function validImages(node: RichNode): boolean {
  return (
    (node.type !== "image" || typeof node.attrs?.src === "string") &&
    (node.content?.every(validImages) ?? true)
  );
}
export const richDocumentSchema = z
  .unknown()
  .refine(bounded, "This formatted content is too complex.")
  .pipe(nodeSchema)
  .refine((node) => node.type === "doc", "Expected a rich-text document.")
  .refine(validImages, "Each image needs an uploaded source.");
export const questionDocumentSchema = richDocumentSchema;
export function hasImages(node: RichNode): boolean {
  return node.type === "image" || !!node.content?.some(hasImages);
}
export function richText(node: RichNode): string {
  if (node.type === "text") return node.text || "";
  if (node.type === "image") return "";
  if (node.type === "hardBreak") return "\n";
  const parts = node.content?.map(richText) || [];
  return parts.join(
    ["doc", "bulletList", "orderedList"].includes(node.type) ? "\n" : "",
  );
}
export function plainDocument(text: string): RichNode {
  return {
    type: "doc",
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

/** Keep attached images when a Focus-mode field changes its plain text. */
export function editPlainDocument(
  text: string,
  document?: RichNode | null,
): RichNode | null {
  if (!document) return null;
  if (richText(document).trim() === text.trim()) return document;
  const images = (node: RichNode): RichNode[] =>
    node.type === "image" ? [node] : node.content?.flatMap(images) || [];
  const next = plainDocument(text);
  next.content?.push(...images(document));
  return next;
}
export function attachImage(
  text: string,
  document: RichNode | null | undefined,
  src: string,
  alt: string,
): RichNode {
  const next = structuredClone(
    editPlainDocument(text, document) || plainDocument(text),
  );
  next.content?.push({ type: "image", attrs: { src, alt } });
  return next;
}
