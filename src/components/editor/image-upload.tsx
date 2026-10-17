"use client";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useWorkspace } from "@/components/workspace/workspace-context";
export function ImageUpload({
  purpose,
  onUpload,
  onBusyChange,
}: {
  purpose: "deck" | "answer";
  onUpload: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { isPreview, uploadsEnabled } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="image-upload">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={`Upload ${purpose} image`}
        disabled={busy || isPreview || !uploadsEnabled}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setError("Choose an image under 5 MB.");
            event.target.value = "";
            return;
          }
          setBusy(true);
          onBusyChange?.(true);
          setError("");
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
        }}
      />
      <button
        type="button"
        className="button"
        disabled={busy || isPreview || !uploadsEnabled}
        onClick={() => input.current?.click()}
      >
        {busy ? (
          <LoaderCircle size={16} className="spin" />
        ) : (
          <ImagePlus size={16} />
        )}{" "}
        {busy
          ? "Uploading…"
          : purpose === "deck"
            ? "Upload deck image"
            : "Attach image"}
      </button>
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
