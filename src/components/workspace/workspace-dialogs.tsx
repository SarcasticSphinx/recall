"use client";
import { useWorkspace } from "./workspace-context";
import { Modal } from "./modal";
import { Feedback } from "./feedback";
import { CardEditor } from "./card-editor";
import { DeckEditor } from "./deck-editor";
import { Icon } from "@/components/icon";
export function WorkspaceDialogs() {
  const {
    modal,
    setModal,
    busy,
    setError,
    error,
    authEnabled,
    signIn,
    mutate,
    setSelectedDeck,
    setNotice,
  } = useWorkspace();
  if (!modal) return null;
  const title =
    modal.type === "deck"
      ? modal.deck
        ? "Edit your deck"
        : "Start a new curiosity."
      : modal.type === "card"
        ? modal.card
          ? "Refine your card."
          : "One good question."
        : modal.type === "delete"
          ? `Delete this ${modal.kind}?`
          : "A little space for your mind.";
  return (
    <Modal
      variant={modal.type === "signin" ? "signin" : undefined}
      title={title}
      close={() => {
        if (!busy) {
          setModal(null);
          setError("");
        }
      }}
    >
      {error && <Feedback />}
      {modal.type === "deck" && <DeckEditor deck={modal.deck} />}
      {modal.type === "card" && (
        <CardEditor card={modal.card} deckId={modal.deckId} />
      )}
      {modal.type === "delete" && (
        <>
          <p className="modal-description">
            “{modal.name}” will be permanently deleted
            {modal.kind === "deck" ? ", along with every card in it" : ""}.
            Previous review activity stays in your daily count. This cannot be
            undone.
          </p>
          <div className="modal-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setModal(null)}
            >
              Keep it
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate({
                    type: modal.kind === "deck" ? "deleteDeck" : "deleteCard",
                    id: modal.id,
                  })
                ) {
                  if (modal.kind === "deck") setSelectedDeck(null);
                  setModal(null);
                  setNotice("Deleted.");
                }
              }}
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </>
      )}
      {modal.type === "signin" && (
        <>
          <p className="modal-description">
            Pick up where curiosity left you. Your cards, your practice,
            together wherever you go.
          </p>
          {!authEnabled && (
            <div className="setup-note">
              <strong>Google sign-in is being connected.</strong>
              <p>
                You can explore the preview now. Account syncing will be
                available once sign-in setup is complete.
              </p>
            </div>
          )}
          <button
            className="button google-button"
            disabled={!authEnabled || busy}
            onClick={signIn}
          >
            <Icon name="login" size={18} />
            {busy ? "Opening Google…" : "Continue with Google"}
            {!busy && <Icon name="arrow" size={17} />}
          </button>
          <p className="form-hint">
            New here? Your account is created when you sign in. Your browser
            preview stays separate.
          </p>
        </>
      )}
    </Modal>
  );
}
