"use client";
import { useEffect, useImperativeHandle, type Ref } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading2,
  Undo2,
  Redo2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { plainDocument, richText, type RichNode } from "@/lib/rich-content";
import { ImageUpload } from "./image-upload";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
const SafeImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => {
          const source = element.getAttribute("src") || "";
          return source.startsWith("blob:") ||
            /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(
              source,
            )
            ? source
            : null;
        },
      },
    };
  },
});

export type RichEditorHandle = { readDocument: () => RichNode | null };
export function RichEditor({
  label,
  value,
  text,
  purpose,
  onChange,
  onSelectImage,
  disabled = false,
  handle,
}: {
  label: string;
  value?: RichNode | null;
  text: string;
  purpose: "question" | "answer";
  onChange: (value: RichNode, text: string) => void;
  onSelectImage: (file: File) => string;
  disabled?: boolean;
  handle?: Ref<RichEditorHandle>;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      SafeImage.configure({ allowBase64: false }),
    ],
    immediatelyRender: false,
    content: value || plainDocument(text),
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as RichNode;
      onChange(doc, richText(doc));
    },
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useImperativeHandle(
    handle,
    () => ({
      readDocument: () => (editor ? (editor.getJSON() as RichNode) : null),
    }),
    [editor],
  );
  useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            code: editor.isActive("code"),
            heading: editor.isActive("heading"),
            quote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
          }
        : null,
  });
  function tool(
    name: string,
    Icon: LucideIcon,
    action: () => void,
    active = false,
  ) {
    return (
      <button
        key={name}
        type="button"
        className="editor-tool"
        aria-label={name}
        aria-pressed={active}
        title={name}
        disabled={!editor}
        onClick={action}
      >
        <Icon size={16} />
      </button>
    );
  }
  return (
    <div className="rich-editor">
      <div
        className="rich-toolbar"
        role="toolbar"
        aria-label={`${label} formatting`}
      >
        <ImageUpload
          purpose={purpose}
          disabled={disabled || !editor}
          onSelect={(file) => {
            const src = onSelectImage(file);
            editor
              ?.chain()
              .focus()
              .setImage({ src, alt: `${label} illustration` })
              .run();
          }}
        />
        {tool(
          "Bold",
          Bold,
          () => editor?.chain().focus().toggleBold().run(),
          editor?.isActive("bold"),
        )}
        {tool(
          "Italic",
          Italic,
          () => editor?.chain().focus().toggleItalic().run(),
          editor?.isActive("italic"),
        )}
        {tool(
          "Underline",
          Underline,
          () => editor?.chain().focus().toggleUnderline().run(),
          editor?.isActive("underline"),
        )}
        {tool(
          "Bullet list",
          List,
          () => editor?.chain().focus().toggleBulletList().run(),
          editor?.isActive("bulletList"),
        )}
        {tool(
          "Numbered list",
          ListOrdered,
          () => editor?.chain().focus().toggleOrderedList().run(),
          editor?.isActive("orderedList"),
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="editor-tool"
              aria-label="More formatting"
              title="More formatting"
              disabled={!editor}
            >
              <Code size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 />
              Heading
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <Quote />
              Quote
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => editor?.chain().focus().toggleCode().run()}
            >
              <Code />
              Inline code
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => editor?.chain().focus().toggleCodeBlock().run()}
            >
              <Code />
              Code block
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => editor?.chain().focus().unsetLink().run()}
              disabled={!editor?.isActive("link")}
            >
              <Unlink />
              Remove link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {tool("Undo", Undo2, () => editor?.chain().focus().undo().run())}
        {tool("Redo", Redo2, () => editor?.chain().focus().redo().run())}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
