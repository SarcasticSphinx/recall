"use client";
import { RecallMark } from "@/components/recall-mark";
import { useControllerContext, useWorkspace } from "./workspace-context";
import { WorkspaceNavigation } from "./navigation";
import { WorkspaceHeader } from "./header";
import { TodayPage } from "./today-page";
import { DecksPage } from "./decks-page";
import { DeckDetail } from "./deck-detail";
import { PreferencesPage } from "./preferences-page";
import { WorkspaceDialogs } from "./workspace-dialogs";
import { ReviewSession } from "./review-session";
import { WorkspaceToasts } from "./workspace-toasts";
import { Feedback } from "./feedback";
export function WorkspaceShell() {
  const {
    workspace,
    error,
    loadError,
    user,
    refresh,
    refreshing,
    signIn,
    busy,
    authEnabled,
  } = useControllerContext();
  if (!workspace)
    return (
      <main className="startup">
        <div className="brand">
          <RecallMark size={30} />
          recall
        </div>
        <p role={error ? "alert" : "status"}>
          {error ||
            (loadError
              ? "Your account could not be loaded. Check your connection and try again."
              : "Making room for a little practice…")}
        </p>
        {(error || loadError) && (
          <div className="startup-actions">
            <button
              className="button primary"
              disabled={refreshing || busy}
              onClick={() => (user ? void refresh() : location.reload())}
            >
              {refreshing ? "Loading your workspace…" : "Try again"}
            </button>
            {user && authEnabled && (
              <button
                className="button"
                disabled={refreshing || busy}
                onClick={() => void signIn()}
              >
                {busy ? "Opening Google…" : "Sign in again"}
              </button>
            )}
          </div>
        )}
      </main>
    );
  return <LoadedWorkspace />;
}
function LoadedWorkspace() {
  const { isPreview, loadError, modal, session, view, deck } = useWorkspace();
  return (
    <div className="app-shell">
      <WorkspaceToasts />
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
        {loadError && isPreview && (
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
