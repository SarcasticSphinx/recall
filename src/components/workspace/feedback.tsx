"use client";
import { useWorkspace } from "./workspace-context";

export function Feedback() {
  const { user, error, busy, setSession, refresh } = useWorkspace();
  return error ? (
    <div className="feedback error" role="alert">
      {error}
      {user && !busy && (
        <button
          onClick={() => {
            setSession(null);
            void refresh();
          }}
        >
          Refresh workspace
        </button>
      )}
    </div>
  ) : null;
}
