"use client";
import { WorkspaceProvider } from "./workspace/workspace-context";
import { WorkspaceShell } from "./workspace/workspace-shell";
import type { WorkspaceProps } from "./workspace/types";
export function RecallApp(props: WorkspaceProps) {
  return (
    <WorkspaceProvider {...props}>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}
