"use client";
import { useControllerContext, useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { WorkspaceNavigation } from "./navigation";
import { WorkspaceHeader } from "./header";
import { TodayPage } from "./today-page";
import { DecksPage } from "./decks-page";
import { DeckDetail } from "./deck-detail";
import { PreferencesPage } from "./preferences-page";
import { WorkspaceDialogs } from "./workspace-dialogs";
import { ReviewSession } from "./review-session";
import { Feedback } from "./feedback";
export function WorkspaceShell() {
  const { workspace, error, loadError } = useControllerContext();
  if (!workspace)
    return (
      <main className="startup">
        <div className="brand">
          <Icon name="cards" size={30} />
          recall
        </div>
        <p role={error ? "alert" : "status"}>
          {error ||
            (loadError
              ? "Your account could not be loaded. Check your connection and try again."
              : "Making room for a little practice…")}
        </p>
        {(error || loadError) && (
          <button className="button primary" onClick={() => location.reload()}>
            Try again
          </button>
        )}
      </main>
    );
  return <LoadedWorkspace />;
}
function LoadedWorkspace() {
  const { isPreview, loadError, modal, session, view, deck } = useWorkspace();
  return (
    <div className="app-shell">
      <WorkspaceNavigation />
      <div className="main-shell">
        <WorkspaceHeader />
        {isPreview && (
          <div className="preview-banner">
            <span className="preview-dot" />
            <span>
              Preview workspace{" "}
              <span className="preview-detail">
                — changes stay in this browser.
              </span>
            </span>
            <span className="preview-tag">TRY IT OUT</span>
          </div>
        )}
        {loadError && (
          <div className="feedback error" role="alert">
            Your account could not be loaded. This is a separate browser
            preview. Reload to retry your account.
          </div>
        )}
        <main id="main-content" className="main-content">
          {!modal && !session && <Feedback />}
          {view === "today" && <TodayPage />}
          {view === "decks" && (deck ? <DeckDetail /> : <DecksPage />)}
          {view === "settings" && <PreferencesPage />}
        </main>
      </div>
      <WorkspaceDialogs />
      {session && <ReviewSession />}
    </div>
  );
}
