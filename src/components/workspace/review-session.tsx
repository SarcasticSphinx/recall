"use client";
import { usePageCopy } from "@/hooks/use-page-copy";
import { useEffect, useRef } from "react";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { intervalLabel } from "@/lib/study";
import { ReviewCard } from "./review-card";
import { Feedback } from "./feedback";
export function ReviewSession() {
  const {
    workspace,
    currentCard,
    sessionDone,
    session,
    busy,
    setError,
    setNotice,
    setSession,
    rate,
  } = useWorkspace();
  const copy = usePageCopy();
  const studyDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = studyDialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    element?.focus();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  if (!session) return null;
  return (
    <dialog
      ref={studyDialog}
      tabIndex={-1}
      className="study-overlay"
      aria-label="Review session"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) {
          setSession(null);
          setError("");
        }
      }}
    >
      <header className="study-header">
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            setSession(null);
            setError("");
          }}
        >
          <Icon name="back" size={18} />
          Leave session
        </button>
        <span>
          {session.title}
          <small className="session-mode-label">
            {session.mode === "practice"
              ? "Free practice · dates unchanged"
              : "Scheduled review"}
          </small>
        </span>
        <span className="study-counter">
          {session.index} / {session.cards.length}
        </span>
      </header>
      <div
        className="study-progress"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={session.cards.length}
        aria-valuenow={session.index}
      >
        <span
          style={{
            width: `${(session.index / session.cards.length) * 100}%`,
          }}
        />
      </div>
      <div className="study-body">
        <Feedback />
        {sessionDone ? (
          <div className="completion">
            <span className="completion-mark">
              <Icon name="check" size={42} />
            </span>
            <div className="eyebrow">A LITTLE MORE THAT STAYS</div>
            <h1>{copy.complete}</h1>
            <p>
              You practiced {session.index}{" "}
              {session.index === 1 ? "card" : "cards"}. Every attempt is a step
              forward.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setSession(null);
                setNotice(
                  session.mode === "practice"
                    ? "Practice saved. Your review dates are unchanged."
                    : "Session complete. Your reviews are saved.",
                );
              }}
            >
              Back to your day
              <Icon name="arrow" size={18} />
            </button>
          </div>
        ) : (
          currentCard && (
            <>
              <div className="study-intro">
                <span className="eyebrow">
                  {
                    workspace.decks.find((d) => d.id === currentCard.deckId)
                      ?.name
                  }
                </span>
                <span className="pill">
                  {session.mode === "practice"
                    ? "FREE PRACTICE"
                    : currentCard.schedule.reps === 0
                      ? "NEW CARD"
                      : "REVIEW"}
                </span>
              </div>
              <ReviewCard card={currentCard} revealed={session.revealed} />
              <div className="review-controls">
                {!session.revealed ? (
                  <>
                    <button
                      className="button primary reveal-button"
                      onClick={() =>
                        setSession((s) => (s ? { ...s, revealed: true } : null))
                      }
                    >
                      Show answer
                      <Icon name="arrow" size={18} />
                    </button>
                    <span className="keyboard-hint">
                      or press <kbd>space</kbd>
                    </span>
                  </>
                ) : (
                  <>
                    <p className="rating-prompt">How did that feel?</p>
                    <div className="rating-grid">
                      {["Again", "Hard", "Good", "Easy"].map((label, i) => (
                        <button
                          className={`rating rating-${i}`}
                          key={label}
                          disabled={busy}
                          onClick={() => void rate(i + 1)}
                        >
                          <span className="rating-key">{i + 1}</span>
                          <strong>{label}</strong>
                          <span>
                            {session.mode === "practice"
                              ? [
                                  "Try again",
                                  "A little unsure",
                                  "Remembered",
                                  "Effortless",
                                ][i]
                              : intervalLabel(currentCard.schedule, i + 1)}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="keyboard-hint">
                      {busy
                        ? "Saving your review…"
                        : "Be honest with yourself. There's no wrong rating."}
                    </span>
                  </>
                )}
              </div>
            </>
          )
        )}
      </div>
    </dialog>
  );
}
