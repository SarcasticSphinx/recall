import Image from "next/image";
import type { ReactNode } from "react";
import type { RichNode } from "@/lib/rich-content";
function render(node: RichNode, key: string, eagerImages: boolean): ReactNode {
  const children = node.content?.map((child, i) =>
    render(child, `${key}-${i}`, eagerImages),
  );
  if (node.type === "text")
    return (node.marks || []).reduce<ReactNode>((text, mark) => {
      switch (mark.type) {
        case "bold":
          return <strong key={key}>{text}</strong>;
        case "italic":
          return <em key={key}>{text}</em>;
        case "underline":
          return <u key={key}>{text}</u>;
        case "strike":
          return <s key={key}>{text}</s>;
        case "code":
          return <code key={key}>{text}</code>;
        case "link":
          return (
            <a
              key={key}
              href={mark.attrs?.href || undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text}
            </a>
          );
        default:
          return text;
      }
    }, node.text || "");
  switch (node.type) {
    case "doc":
      return (
        <div key={key} className="rich-content">
          {children}
        </div>
      );
    case "paragraph":
      return <p key={key}>{children?.length ? children : <br />}</p>;
    case "heading":
      return node.attrs?.level === 1 ? (
        <h2 key={key}>{children}</h2>
      ) : node.attrs?.level === 2 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h4 key={key}>{children}</h4>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Number(node.attrs?.start) || 1}>
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return typeof node.attrs?.src === "string" ? (
        <Image
          key={key}
          src={node.attrs.src}
          alt={String(node.attrs.alt || "Card illustration")}
          loading={eagerImages ? "eager" : "lazy"}
          width={1000}
          height={750}
          unoptimized
          className="answer-image"
        />
      ) : null;
    default:
      return null;
  }
}
export function RichContent({
  document,
  text,
  eagerImages = false,
}: {
  document?: RichNode | null;
  text: string;
  eagerImages?: boolean;
}) {
  return document ? (
    render(document, "doc", eagerImages)
  ) : (
    <p className="plain-content">{text}</p>
  );
}
