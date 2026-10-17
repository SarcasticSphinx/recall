"use client";
import { RecallMark } from "@/components/recall-mark";
import { useWorkspace } from "./workspace-context";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/icon";
export function WorkspaceNavigation() {
  const {
    workspace,
    user,
    view,
    queue,
    isPreview,
    navigate,
    selectedDeck,
    setSelectedDeck,
    setError,
    setModal,
  } = useWorkspace();
  return (
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Recall home">
        <span className="brand-mark">
          <RecallMark size={25} />
        </span>
        recall<span className="brand-dot">.</span>
      </Link>
      <div className="sidebar-caption">YOUR LITTLE LEARNING SPACE</div>
      <nav
        aria-label="Main navigation"
        style={
          {
            "--nav-index": view === "today" ? 0 : view === "decks" ? 1 : 2,
          } as CSSProperties
        }
      >
        <span className="dock-selection" aria-hidden="true" />
        <button
          className={`nav-item ${view === "today" ? "active" : ""}`}
          aria-current={view === "today" ? "page" : undefined}
          onClick={() => navigate("today")}
        >
          <Icon name="sun" />
          <span className="nav-label">Today</span>
          <span className="nav-count">{queue.length}</span>
        </button>
        <button
          className={`nav-item ${view === "decks" ? "active" : ""}`}
          aria-current={view === "decks" ? "page" : undefined}
          onClick={() => navigate("decks")}
        >
          <Icon name="grid" />
          <span className="nav-label">My decks</span>
        </button>
        <button
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => navigate("settings")}
        >
          <Icon name="settings" />
          <span className="nav-label">Preferences</span>
        </button>
      </nav>
      <div className="sidebar-decks">
        <div className="section-label">
          YOUR DECKS
          <button
            className="icon-button"
            aria-label="Create a deck"
            onClick={() => {
              setError("");
              setModal({ type: "deck" });
            }}
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
        {workspace.decks.slice(0, 6).map((d) => (
          <button
            key={d.id}
            className={`sidebar-deck ${selectedDeck === d.id ? "selected" : ""}`}
            onClick={() => {
              navigate("decks");
              setSelectedDeck(d.id);
            }}
          >
            <span className={`color-dot ${d.color}`} />
            {d.name}
          </button>
        ))}
        {!workspace.decks.length && (
          <p className="small muted">Your next idea starts with a deck.</p>
        )}
      </div>
      <div className="sidebar-bottom">
        <div className="thought">
          <span>
            Small steps.
            <br />
            Lasting knowledge.
          </span>
          <span className="thought-flower">
            <Icon name="spark" size={28} />
          </span>
        </div>
        <button
          className="profile"
          onClick={() =>
            isPreview ? setModal({ type: "signin" }) : navigate("settings")
          }
        >
          <span className="avatar">
            {user?.name?.[0]?.toUpperCase() || "Y"}
          </span>
          <span>
            <strong>{user?.name || "Your workspace"}</strong>
            <small>{isPreview ? "Preview mode" : "Personal account"}</small>
          </span>
          <Icon name={isPreview ? "arrow" : "settings"} size={16} />
        </button>
      </div>
    </aside>
  );
}
