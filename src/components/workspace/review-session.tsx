"use client";
import { usePageCopy } from "@/hooks/use-page-copy";
import { useRef, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { intervalLabel } from "@/lib/study";
import { ReviewCard } from "./review-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  const [open, setOpen] = useState(true);
  const studyContent = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  if (!session) return null;
  function leave() {
    if (busy) return;
    setOpen(false);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) leave();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        ref={studyContent}
        tabIndex={-1}
        className="study-overlay"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          previousFocus.current = document.activeElement as HTMLElement | null;
          studyContent.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (previousFocus.current?.isConnected) previousFocus.current.focus();
          setSession(null);
          setError("");
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <SheetTitle className="sr-only">Review session</SheetTitle>
        <SheetDescription className="sr-only">
          Recall each answer, reveal it, then rate how well you remembered.
        </SheetDescription>
        <header className="study-header">
          <Button
            variant="ghost"
            className="text-button"
            disabled={busy}
            onClick={leave}
          >
            <Icon name="back" size={18} />
            Leave session
          </Button>
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
        <Progress
          className="study-progress"
          value={(session.index / session.cards.length) * 100}
          aria-label="Session progress"
          aria-valuetext={`${session.index} of ${session.cards.length} cards`}
        />
        <ScrollArea className="study-scroll">
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
                  {session.index === 1 ? "card" : "cards"}. Every attempt is a
                  step forward.
                </p>
                <Button
                  className="button primary"
                  onClick={() => {
                    leave();
                    setNotice(
                      session.mode === "practice"
                        ? "Practice saved. Your review dates are unchanged."
                        : "Session complete. Your reviews are saved.",
                    );
                  }}
                >
                  Back to your day
                  <Icon name="arrow" size={18} />
                </Button>
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
                    <Badge variant="secondary" className="pill">
                      {session.mode === "practice"
                        ? "FREE PRACTICE"
                        : currentCard.schedule.reps === 0
                          ? "NEW CARD"
                          : "REVIEW"}
                    </Badge>
                  </div>
                  <ReviewCard card={currentCard} revealed={session.revealed} />
                  <div className="review-controls">
                    {!session.revealed ? (
                      <>
                        <Button
                          className="button primary reveal-button"
                          onClick={() =>
                            setSession((s) =>
                              s ? { ...s, revealed: true } : null,
                            )
                          }
                        >
                          Show answer
                          <Icon name="arrow" size={18} />
                        </Button>
                        <span className="keyboard-hint">
                          or press <kbd>space</kbd>
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="rating-prompt">How did that feel?</p>
                        <div className="rating-grid">
                          {["Again", "Hard", "Good", "Easy"].map((label, i) => (
                            <Button
                              variant="outline"
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
                            </Button>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
