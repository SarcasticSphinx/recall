"use client";
import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { validateImageFile, type ImagePurpose } from "@/lib/pending-images";
/** A file picker only. Uploading is owned by the enclosing form's Save action. */
export function ImageUpload({
  purpose,
  onSelect,
  dropzone = false,
  children,
  label,
  disabled = false,
}: {
  purpose: ImagePurpose;
  onSelect: (file: File) => void;
  dropzone?: boolean;
  children?: ReactNode;
  label?: string;
  disabled?: boolean;
}) {
  const { isPreview, uploadsEnabled, setError } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const unavailable = disabled || isPreview || !uploadsEnabled;
  const hint = isPreview
    ? "Sign in to attach images."
    : !uploadsEnabled
      ? "Cloudinary uploads need to be configured."
      : "Selected images upload when you save.";
  function select(file?: File) {
    if (!file || unavailable) return;
    try {
      validateImageFile(file);
      setError("");
      onSelect(file);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Choose a valid image.",
      );
    }
  }
  return (
    <div
      className={`image-upload ${dropzone ? "cover-upload" : "image-picker-compact"}`}
    >
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        style={{ display: "none" }}
        tabIndex={-1}
        aria-label={`Choose ${purpose} image`}
        disabled={unavailable}
        onChange={(event) => {
          select(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {dropzone ? (
        <>
          <button
            type="button"
            className={`upload-dropzone ${dragging ? "is-dragging" : ""}`}
            disabled={unavailable}
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              if (!unavailable) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              select(event.dataTransfer.files[0]);
            }}
          >
            {children}
            <span className="cover-upload-caption">
              <UploadCloud size={18} />
              <strong>{label || "Choose a cover image"}</strong>
              <span>Drop an image here or browse files</span>
              <small>JPEG, PNG, WebP · up to 5 MB</small>
            </span>
          </button>
          <p className="form-hint">{hint}</p>
        </>
      ) : (
        <button
          type="button"
          className="editor-tool"
          disabled={unavailable}
          aria-label={`Add ${purpose} image`}
          title={unavailable ? hint : `Add ${purpose} image · uploads on Save`}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={16} />
        </button>
      )}
    </div>
  );
}
