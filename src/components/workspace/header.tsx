"use client";
import { RecallMark } from "@/components/recall-mark";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { ThemeControl } from "@/components/theme-control";
export function WorkspaceHeader() {
  const { view, date, isPreview, navigate, setError, setModal } =
    useWorkspace();
  return (
    <header className="topbar">
      <button
        className="mobile-brand"
        onClick={() => navigate("today")}
        aria-label="Recall home"
      >
        <RecallMark size={22} />
        <span>
          recall<span className="brand-dot">.</span>
        </span>
      </button>
      <span className="desktop-breadcrumb">
        <span className="muted">Workspace</span>
        <span className="breadcrumb">/</span>
        {view === "today"
          ? "Today"
          : view === "decks"
            ? "My decks"
            : "Preferences"}
      </span>
      <div className="topbar-right">
        <ThemeControl compact />
        <span className="date-label">{date}</span>
        {isPreview && (
          <button
            className="button small-button"
            onClick={() => {
              setError("");
              setModal({ type: "signin" });
            }}
          >
            <span className="sync-label">Sign in to sync</span>
            <span className="mobile-sync-label">Sync</span>
            <Icon name="arrow" size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
