"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useWorkspace } from "./workspace-context";
export function WorkspaceToasts() {
  const { notice, setNotice } = useWorkspace();
  useEffect(() => {
    if (notice) {
      toast.success(notice);
      setNotice("");
    }
  }, [notice, setNotice]);
  return (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{ className: "recall-toast" }}
    />
  );
}
