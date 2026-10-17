"use client";
import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, LoaderCircle, UploadCloud, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/workspace/workspace-context";
export function ImageUpload({
  purpose,
  onUpload,
  onBusyChange,
  dropzone = false,
  children,
  label,
}: {
  purpose: "deck" | "question" | "answer";
  onUpload: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
  dropzone?: boolean;
  children?: ReactNode;
  label?: string;
}) {
  const { isPreview, uploadsEnabled } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const disabled = busy || isPreview || !uploadsEnabled;
  async function upload(file?: File) {
    if (!file || disabled) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image under 5 MB.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", purpose);
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Upload failed.");
      onUpload(body.url);
      setFilename(file.name);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The image could not be uploaded.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className={`image-upload ${dropzone ? "cover-upload" : ""}`}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        style={{ display: "none" }}
        tabIndex={-1}
        aria-label={`Upload ${purpose} image`}
        disabled={disabled}
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {dropzone ? (
        <button
          type="button"
          className={`upload-dropzone ${dragging ? "is-dragging" : ""}`}
          disabled={disabled}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files[0]);
          }}
        >
          {children}
          <span className="cover-upload-caption">
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <UploadCloud size={18} />
            )}
            <strong>
              {busy ? "Uploading your cover…" : label || "Upload a cover"}
            </strong>
            <span>Drop an image here or browse files</span>
            <small>JPEG, PNG, WebP · up to 5 MB</small>
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ImagePlus size={16} />
          )}{" "}
          {busy ? "Uploading…" : label || "Attach image"}
        </button>
      )}
      {filename && (
        <Badge variant="secondary" className="attachment-chip">
          <Paperclip size={13} />
          <span>{filename}</span>
        </Badge>
      )}
      {(isPreview || !uploadsEnabled) && (
        <p className="form-hint">
          {isPreview
            ? "Sign in to upload images."
            : "Cloudinary uploads need to be configured."}
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
