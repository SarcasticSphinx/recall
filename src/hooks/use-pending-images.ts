"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  documentForValidation,
  resolveImageDocument,
  resolveImageSource,
  validateImageFile,
  type PendingImage,
  type ImagePurpose,
} from "@/lib/pending-images";
import type { RichNode } from "@/lib/rich-content";
export function usePendingImages() {
  const pending = useRef(new Map<string, PendingImage>());
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const { setError, setMediaBusy } = useWorkspace();
  useEffect(() => {
    const entries = pending.current;
    return () => {
      for (const url of entries.keys()) URL.revokeObjectURL(url);
      entries.clear();
    };
  }, []);
  function stage(file: File) {
    validateImageFile(file);
    const url = URL.createObjectURL(file);
    pending.current.set(url, { file });
    return url;
  }
  async function upload(file: File, purpose: ImagePurpose) {
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", purpose);
    const response = await fetch("/api/uploads", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.message ||
          "The image could not be uploaded. Your edits are still here.",
      );
    return result.url as string;
  }
  async function save(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setMediaBusy(true);
    setError("");
    try {
      await task();
    } catch (error) {
      setError(
        error instanceof z.ZodError
          ? error.issues[0]?.message || "Check your fields."
          : error instanceof Error
            ? error.message
            : "Could not save. Your edits are still here.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
      setMediaBusy(false);
    }
  }
  return {
    stage,
    save,
    saving,
    forValidation: (doc: RichNode | null) =>
      documentForValidation(doc, pending.current),
    resolveDocument: (doc: RichNode | null, purpose: "question" | "answer") =>
      resolveImageDocument(doc, pending.current, (file) =>
        upload(file, purpose),
      ),
    resolveCover: (src: string) =>
      resolveImageSource(src, pending.current, (file) => upload(file, "deck")),
  };
}
