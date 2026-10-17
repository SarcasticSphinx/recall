"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { applyPreview, createPreview } from "@/lib/preview";
import {
  intervalLabel,
  studyQueue,
  todayReviews,
  type Deck,
  type StudyCard,
  type Workspace,
} from "@/lib/study";
import {
  actionSchema,
  colors,
  workspaceSchema,
  type WorkspaceAction,
} from "@/lib/validation";
import { Icon } from "./icon";
import { ThemeControl } from "./theme-control";

type Props = {
  user: { name: string; email: string } | null;
  initialWorkspace: Workspace | null;
  authEnabled: boolean;
  loadError: boolean;
};
type ModalState =
  | { type: "deck"; deck?: Deck }
  | { type: "card"; deckId: string; card?: StudyCard }
  | { type: "delete"; kind: "deck" | "card"; id: string; name: string }
  | { type: "signin" }
  | null;
type StudySession = {
  cards: StudyCard[];
  index: number;
  title: string;
  revealed: boolean;
  operationId: string;
};
const storageKey = "recall.preview.v1";

function Modal({
  title,
  close,
  children,
  variant,
}: {
  variant?: "signin";
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    element?.showModal();
    (
      element?.querySelector(
        "input:not([type=radio]), textarea",
      ) as HTMLElement | null
    )?.focus();
    return () => {
      element?.close();
      previouslyFocused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`modal ${variant === "signin" ? "signin-modal" : ""}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const bounds = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom
          )
            close();
        }
      }}
    >
      {variant === "signin" && (
        <div className="signin-art" aria-hidden="true">
          <svg viewBox="0 0 320 150" fill="none">
            <path
              className="memory-line memory-line-one"
              d="M0 104C51 104 59 35 111 35S188 118 233 80 283 45 320 48"
            />
            <path
              className="memory-line memory-line-two"
              d="M0 120C59 120 79 56 128 56S183 104 225 61 281 27 320 29"
            />
            <path
              className="memory-line memory-line-three"
              d="M0 84C48 84 71 17 116 17S191 88 236 46 287 13 320 12"
            />
            <circle className="memory-orbit" cx="160" cy="75" r="48" />
          </svg>
          <span className="signin-mark">
            <Icon name="cards" size={30} />
          </span>
          <span className="signin-art-caption">
            A LITTLE PRACTICE. A LASTING TRACE.
          </span>
        </div>
      )}
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function RecallApp({
  user,
  initialWorkspace,
  authEnabled,
  loadError,
}: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(
    initialWorkspace,
  );
  const [view, setView] = useState<"today" | "decks" | "settings">("today");
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const workspaceRef = useRef(workspace);
  const busyRef = useRef(false);
  const studyDialog = useRef<HTMLDialogElement>(null);
  const studying = Boolean(session);
  useEffect(() => {
    if (!studying) return;
    const element = studyDialog.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    element?.showModal();
    element?.focus();
    return () => {
      element?.close();
      previouslyFocused?.focus();
    };
  }, [studying]);
  const isPreview = !user;

  const refresh = useCallback(async () => {
    if (!user || busyRef.current) return;
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Could not refresh your workspace.");
      workspaceRef.current = body;
      setWorkspace(body);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not refresh your workspace.",
      );
    }
  }, [user]);

  useEffect(() => {
    if (user) return;
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored
        ? workspaceSchema.safeParse(JSON.parse(stored))
        : null;
      if (stored && !parsed?.success)
        throw new Error(
          "Saved preview data could not be read. Export or clear this site's storage to reset it.",
        );
      const next = parsed?.success
        ? (parsed.data as Workspace)
        : createPreview();
      workspaceRef.current = next;
      // Hydrate browser-only storage after the shared server/client loading state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspace(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Browser storage is unavailable.",
      );
    }
  }, [user]);

  useEffect(() => {
    const tick = () => {
      setClock(new Date());
      void refresh();
    };
    window.addEventListener("focus", tick);
    const interval = window.setInterval(() => setClock(new Date()), 30000);
    return () => {
      window.removeEventListener("focus", tick);
      window.clearInterval(interval);
    };
  }, [refresh]);

  async function mutate(input: WorkspaceAction) {
    if (busyRef.current || !workspaceRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const action = actionSchema.parse(input);
      let next: Workspace;
      if (isPreview) {
        next = applyPreview(workspaceRef.current, action);
        localStorage.setItem(storageKey, JSON.stringify(next));
      } else {
        const response = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.message || "Could not save. Please try again.");
        next = body;
      }
      workspaceRef.current = next;
      setWorkspace(next);
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not save. Please try again.";
      setError(
        message.startsWith("[")
          ? "Please check the fields and try again."
          : message,
      );
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function navigate(next: typeof view) {
    setView(next);
    setSelectedDeck(null);
    setSearch("");
    setError("");
    if (window.matchMedia("(max-width: 640px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
    void refresh();
  }
  function startStudy(deckId?: string) {
    if (!workspace) return;
    const cards = studyQueue(workspace, deckId);
    if (!cards.length) {
      setNotice(
        "Nothing ready right now. Come back when your next cards are due.",
      );
      return;
    }
    setError("");
    setNotice("");
    setSession({
      cards,
      index: 0,
      title:
        workspace.decks.find((d) => d.id === deckId)?.name ||
        "Today's practice",
      revealed: false,
      operationId: crypto.randomUUID(),
    });
  }
  async function rate(rating: number) {
    if (!session || !session.revealed || busyRef.current) return;
    const card = session.cards[session.index];
    if (!card) return;
    const saved = await mutate({
      type: "review",
      id: card.id,
      version: card.version,
      rating,
      operationId: session.operationId,
    });
    if (saved)
      setSession((current) =>
        current
          ? {
              ...current,
              index: current.index + 1,
              revealed: false,
              operationId: crypto.randomUUID(),
            }
          : null,
      );
  }
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  });
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        !session ||
        modal ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (
        (event.target as HTMLElement).closest(
          "input, textarea, select, button, [contenteditable=true]",
        )
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        setSession((s) => (s ? { ...s, revealed: true } : null));
      }
      if (session.revealed && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        void rateRef.current(Number(event.key));
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [session, modal]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let action: WorkspaceAction | undefined;
    if (modal?.type === "deck")
      action = modal.deck
        ? {
            type: "updateDeck",
            id: modal.deck.id,
            name: String(data.get("name")),
          }
        : {
            type: "createDeck",
            name: String(data.get("name")),
            color: data.get("color") as (typeof colors)[number],
          };
    if (modal?.type === "card")
      action = modal.card
        ? {
            type: "updateCard",
            id: modal.card.id,
            version: modal.card.version,
            question: String(data.get("question")),
            answer: String(data.get("answer")),
          }
        : {
            type: "createCard",
            deckId: modal.deckId,
            question: String(data.get("question")),
            answer: String(data.get("answer")),
          };
    if (action && (await mutate(action))) {
      setModal(null);
      setNotice("Saved. A little more knowledge, ready to practice.");
    }
  }
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result.error)
        throw new Error(
          result.error.message || "Sign-in failed. Please try again.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

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

  const queue = studyQueue(workspace, undefined, clock);
  const todaysReviews = todayReviews(workspace, clock);
  const dueCount = queue.filter((c) => c.schedule.reps > 0).length;
  const newCount = queue.length - dueCount;
  const deck = workspace.decks.find((d) => d.id === selectedDeck);
  const deckCards = workspace.cards.filter((c) => c.deckId === deck?.id);
  const currentCard = session?.cards[session.index];
  const sessionDone = session && session.index >= session.cards.length;
  const date = new Intl.DateTimeFormat("en", {
    timeZone: workspace.preferences.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(clock);
  const feedback = error ? (
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
  ) : notice ? (
    <div className="feedback" role="status">
      {notice}
    </div>
  ) : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Recall home">
          <span className="brand-mark">
            <Icon name="cards" size={25} />
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
            <span className="thought-flower">✳</span>
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

      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-brand"
            onClick={() => navigate("today")}
            aria-label="Recall home"
          >
            <Icon name="cards" size={22} />
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
          {feedback && !modal && !session && feedback}
          {view === "today" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A LITTLE EVERY DAY</div>
                  <h1>A good day to remember.</h1>
                  <p>
                    A few focused minutes. A little more that stays with you.
                  </p>
                </div>
                <span className="heading-spark" aria-hidden="true">
                  ✳
                </span>
              </div>
              <section
                className="practice-hero"
                aria-labelledby="practice-title"
              >
                <div className="hero-copy">
                  <span className="pill">
                    <span className="live-dot" />
                    YOUR DAILY PRACTICE
                  </span>
                  <h2 id="practice-title">
                    Make it
                    <br />
                    <em>second nature.</em>
                  </h2>
                  <p>
                    {queue.length ? (
                      <>
                        <strong>{queue.length} cards</strong> are ready for a
                        little attention.
                        <br />
                        Take your time. See what comes back.
                      </>
                    ) : (
                      <>
                        Your mind deserves a moment to rest.
                        <br />
                        Add something new, or come back when it&apos;s due.
                      </>
                    )}
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      queue.length ? startStudy() : navigate("decks")
                    }
                  >
                    {queue.length
                      ? "Start today's review"
                      : "Explore your decks"}
                    <Icon name="arrow" size={18} />
                  </button>
                  <span className="hero-footnote">
                    {queue.length
                      ? "One question at a time. You've got this."
                      : "Your progress is saved. Keep being curious."}
                  </span>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <span className="orbit orbit-one" />
                  <span className="orbit orbit-two" />
                  <span className="art-spark">✳</span>
                  <div className="art-card art-card-back" />
                  <div className="art-card art-card-middle" />
                  <div className="art-card art-card-front">
                    <span className="art-overline">A THOUGHT TO KEEP</span>
                    <span className="art-question">
                      What will you
                      <br />
                      remember
                      <br />
                      <em>tomorrow?</em>
                    </span>
                    <span className="art-divider" />
                    <span className="art-footer">
                      A LITTLE PRACTICE GOES A LONG WAY{" "}
                      <Icon name="spark" size={18} />
                    </span>
                  </div>
                  <span className="art-caption">
                    give your knowledge a little room to grow ↗
                  </span>
                </div>
              </section>
              <section className="stats-row" aria-label="Study overview">
                <Stat
                  icon="clock"
                  value={dueCount}
                  label="Due for review"
                  detail="A little refresher"
                />
                <Stat
                  icon="cards"
                  value={newCount}
                  label="New to explore"
                  detail="Something to discover"
                />
                <Stat
                  icon="check"
                  value={todaysReviews.length}
                  label="Reviewed today"
                  detail="Every attempt counts"
                />
              </section>
              <div className="section-heading">
                <div>
                  <h2>
                    Your decks
                    <span className="subtle-count">
                      {workspace.decks.length}
                    </span>
                  </h2>
                  <p>A home for everything you&apos;re learning.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("decks")}
                >
                  View all decks
                  <Icon name="arrow" size={17} />
                </button>
              </div>
              <div className="deck-grid">
                {workspace.decks.slice(0, 3).map((d) => (
                  <DeckTile
                    key={d.id}
                    deck={d}
                    workspace={workspace}
                    open={() => {
                      navigate("decks");
                      setSelectedDeck(d.id);
                    }}
                  />
                ))}
                <button
                  className="new-deck-tile"
                  onClick={() => {
                    setError("");
                    setModal({ type: "deck" });
                  }}
                >
                  <span className="new-deck-plus">
                    <Icon name="plus" size={23} />
                  </span>
                  <strong>A new curiosity?</strong>
                  <span>Create a deck</span>
                </button>
              </div>
              <footer className="page-footer">
                <Icon name="spark" size={15} />
                <span>
                  You don&apos;t have to remember everything today. Just keep
                  showing up.
                </span>
              </footer>
            </>
          )}
          {view === "decks" && !deck && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">COLLECT YOUR CURIOSITY</div>
                  <h1>Room for what you learn.</h1>
                  <p>Your ideas, organized into small moments of practice.</p>
                </div>
                <button
                  className="button primary"
                  onClick={() => {
                    setError("");
                    setModal({ type: "deck" });
                  }}
                >
                  <Icon name="plus" size={18} />
                  New deck
                </button>
              </div>
              <div className="deck-grid">
                {workspace.decks.map((d) => (
                  <DeckTile
                    key={d.id}
                    deck={d}
                    workspace={workspace}
                    open={() => {
                      setSelectedDeck(d.id);
                      setSearch("");
                    }}
                  />
                ))}
                <button
                  className="new-deck-tile"
                  onClick={() => {
                    setError("");
                    setModal({ type: "deck" });
                  }}
                >
                  <span className="new-deck-plus">
                    <Icon name="plus" size={23} />
                  </span>
                  <strong>Your next idea starts here.</strong>
                  <span>Create a deck</span>
                </button>
              </div>
            </>
          )}
          {view === "decks" && deck && (
            <>
              <button
                className="text-button back-button"
                onClick={() => {
                  setSelectedDeck(null);
                  setSearch("");
                }}
              >
                <Icon name="back" size={16} />
                All decks
              </button>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {deckCards.length} CARDS · YOUR COLLECTION
                  </div>
                  <h1>{deck.name}</h1>
                  <p>Small questions. Deeper understanding.</p>
                </div>
                <div className="heading-actions">
                  <button
                    className="icon-button"
                    aria-label="Rename deck"
                    onClick={() => setModal({ type: "deck", deck })}
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete deck"
                    onClick={() =>
                      setModal({
                        type: "delete",
                        kind: "deck",
                        id: deck.id,
                        name: deck.name,
                      })
                    }
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
              <div className="deck-toolbar">
                <label className="search-field">
                  <span className="sr-only">Search cards</span>
                  <input
                    type="search"
                    placeholder="Find a question or answer…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  className="button"
                  onClick={() => startStudy(deck.id)}
                  disabled={!studyQueue(workspace, deck.id).length}
                >
                  Review {studyQueue(workspace, deck.id).length}{" "}
                  {studyQueue(workspace, deck.id).length === 1
                    ? "card"
                    : "cards"}
                  <Icon name="arrow" size={17} />
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setError("");
                    setModal({ type: "card", deckId: deck.id });
                  }}
                >
                  <Icon name="plus" size={17} />
                  Add card
                </button>
              </div>
              <div className="card-list">
                {deckCards
                  .filter((c) =>
                    `${c.question} ${c.answer}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((card, i) => (
                    <article className="card-row" key={card.id}>
                      <span className="card-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="card-content">
                        <h3>{card.question}</h3>
                        <p>{card.answer}</p>
                        <span className="card-status">
                          {card.schedule.reps === 0
                            ? "New card"
                            : `Next review: ${new Intl.DateTimeFormat("en", { timeZone: workspace.preferences.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(card.schedule.due))}`}
                        </span>
                      </div>
                      <div className="card-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit card: ${card.question}`}
                          onClick={() => {
                            setError("");
                            setModal({ type: "card", deckId: deck.id, card });
                          }}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete card: ${card.question}`}
                          onClick={() =>
                            setModal({
                              type: "delete",
                              kind: "card",
                              id: card.id,
                              name: card.question,
                            })
                          }
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                {!deckCards.length && (
                  <div className="empty-state">
                    <Icon name="cards" size={40} />
                    <h2>Give your curiosity a question.</h2>
                    <p>Add your first card to start practicing.</p>
                    <button
                      className="button primary"
                      onClick={() =>
                        setModal({ type: "card", deckId: deck.id })
                      }
                    >
                      Create your first card
                      <Icon name="plus" size={17} />
                    </button>
                  </div>
                )}
                {deckCards.length > 0 &&
                  !deckCards.some((c) =>
                    `${c.question} ${c.answer}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <h2>No matching cards.</h2>
                      <p>Try a different word or phrase.</p>
                    </div>
                  )}
              </div>
            </>
          )}
          {view === "settings" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE IT YOUR OWN</div>
                  <h1>A rhythm that works for you.</h1>
                  <p>Keep your practice small, steady, and personal.</p>
                </div>
              </div>
              <section className="appearance-panel">
                <div>
                  <h3>Set the mood.</h3>
                  <p>A lighter day, a quieter night, or follow your device.</p>
                </div>
                <ThemeControl />
                <p className="appearance-hint">
                  Saved on this device. System follows your device’s appearance.
                </p>
              </section>
              <form
                className="settings-panel"
                key={`${workspace.preferences.timezone}-${workspace.preferences.newCardLimit}`}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  if (
                    await mutate({
                      type: "preferences",
                      timezone: String(form.get("timezone")),
                      newCardLimit: Number(form.get("limit")),
                    })
                  )
                    setNotice("Your practice preferences are saved.");
                }}
              >
                <div className="settings-row">
                  <div>
                    <h3>New cards per day</h3>
                    <p>
                      A gentle limit on new material. Due reviews are always
                      available.
                    </p>
                  </div>
                  <input
                    className="number-input"
                    name="limit"
                    type="number"
                    min="0"
                    max="200"
                    required
                    defaultValue={workspace.preferences.newCardLimit}
                    aria-label="Daily new-card limit"
                  />
                </div>
                <div className="settings-row">
                  <div>
                    <h3>Your timezone</h3>
                    <p>
                      Your learning day follows this timezone, including when
                      you travel.
                    </p>
                  </div>
                  <select
                    name="timezone"
                    defaultValue={workspace.preferences.timezone}
                    aria-label="Timezone"
                  >
                    {Array.from(
                      new Set([
                        workspace.preferences.timezone,
                        "UTC",
                        ...Intl.supportedValuesOf("timeZone"),
                      ]),
                    ).map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div className="settings-footer">
                  <button className="button primary" disabled={busy}>
                    {busy ? "Saving…" : "Save preferences"}
                  </button>
                </div>
              </form>
              <section className="account-panel">
                <div>
                  <h3>
                    {isPreview ? "Take your learning with you." : user.name}
                  </h3>
                  <p>
                    {isPreview
                      ? "Sign in to keep your cards and progress together across devices. Preview cards stay separate from your account."
                      : user.email}
                  </p>
                </div>
                {isPreview ? (
                  <button
                    className="button"
                    onClick={() => setModal({ type: "signin" })}
                  >
                    Sign in to sync
                    <Icon name="arrow" size={17} />
                  </button>
                ) : (
                  <button
                    className="button"
                    onClick={async () => {
                      await authClient.signOut();
                      location.reload();
                    }}
                  >
                    Sign out
                    <Icon name="logout" size={17} />
                  </button>
                )}
              </section>
              <section className="ai-note">
                <Icon name="spark" size={24} />
                <div>
                  <h3>A little help, when you need it.</h3>
                  <p>
                    AI-assisted learning is on the horizon. We&apos;re starting
                    with the essentials: your questions, your answers, your
                    practice.
                  </p>
                  <span className="pill">PLANNED</span>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {modal && (
        <Modal
          variant={modal.type === "signin" ? "signin" : undefined}
          title={
            modal.type === "deck"
              ? modal.deck
                ? "Rename your deck"
                : "Start a new curiosity."
              : modal.type === "card"
                ? modal.card
                  ? "Refine your card."
                  : "One good question."
                : modal.type === "delete"
                  ? `Delete this ${modal.kind}?`
                  : "A little space for your mind."
          }
          close={() => {
            if (!busy) {
              setModal(null);
              setError("");
            }
          }}
        >
          {error && feedback}
          {(modal.type === "deck" || modal.type === "card") && (
            <form onSubmit={submitForm}>
              {modal.type === "deck" ? (
                <>
                  <p className="modal-description">
                    Give what you&apos;re learning a little home.
                  </p>
                  <label className="field">
                    Deck name
                    <input
                      name="name"
                      placeholder="e.g. Things I want to remember"
                      maxLength={80}
                      required
                      defaultValue={modal.deck?.name}
                    />
                  </label>
                  {!modal.deck && (
                    <fieldset className="color-picker">
                      <legend>Pick a little color</legend>
                      {colors.map((color) => (
                        <label key={color} className={`color-choice ${color}`}>
                          <input
                            type="radio"
                            name="color"
                            value={color}
                            defaultChecked={color === "indigo"}
                          />
                          <span className="sr-only">{color}</span>
                          <Icon name="check" size={17} />
                        </label>
                      ))}
                    </fieldset>
                  )}
                </>
              ) : (
                <>
                  <p className="modal-description">
                    Keep it focused. One idea is enough.
                  </p>
                  <label className="field">
                    Question
                    <textarea
                      name="question"
                      placeholder="What would you like to recall?"
                      maxLength={2000}
                      rows={3}
                      required
                      defaultValue={modal.card?.question}
                    />
                  </label>
                  <label className="field">
                    Answer
                    <textarea
                      name="answer"
                      placeholder="A clear answer, in your own words."
                      maxLength={10000}
                      rows={4}
                      required
                      defaultValue={modal.card?.answer}
                    />
                  </label>
                  <p className="form-hint">
                    Try answering before you peek. That&apos;s where the
                    learning happens.
                  </p>
                </>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => {
                    setModal(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal.type === "deck"
                      ? modal.deck
                        ? "Save name"
                        : "Create deck"
                      : "Save card"}
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            </form>
          )}
          {modal.type === "delete" && (
            <>
              <p className="modal-description">
                “{modal.name}” will be permanently deleted
                {modal.kind === "deck" ? ", along with every card in it" : ""}.
                Previous review activity stays in your daily count. This cannot
                be undone.
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
                        type:
                          modal.kind === "deck" ? "deleteDeck" : "deleteCard",
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
                <span className="google-g" aria-hidden="true">
                  G
                </span>
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
      )}

      {session && (
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
            <span>{session.title}</span>
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
            {feedback}
            {sessionDone ? (
              <div className="completion">
                <span className="completion-mark">
                  <Icon name="check" size={42} />
                </span>
                <div className="eyebrow">A LITTLE MORE THAT STAYS</div>
                <h1>That was time well spent.</h1>
                <p>
                  You practiced {session.index}{" "}
                  {session.index === 1 ? "card" : "cards"}. Every attempt is a
                  step forward.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setSession(null);
                    setNotice("Session complete. Your reviews are saved.");
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
                      {currentCard.schedule.reps === 0 ? "NEW CARD" : "REVIEW"}
                    </span>
                  </div>
                  <article
                    className={`review-card ${session.revealed ? "is-revealed" : ""}`}
                    key={currentCard.id}
                  >
                    <span className="review-label">
                      TAKE A MOMENT TO RECALL
                    </span>
                    <h1>{currentCard.question}</h1>
                    {session.revealed && (
                      <div className="answer-reveal">
                        <span className="review-label">THE ANSWER</span>
                        <p>{currentCard.answer}</p>
                      </div>
                    )}
                    {!session.revealed && (
                      <div className="recall-prompt">
                        <Icon name="spark" size={20} />
                        <p>Let the answer come to you.</p>
                      </div>
                    )}
                  </article>
                  <div className="review-controls">
                    {!session.revealed ? (
                      <>
                        <button
                          className="button primary reveal-button"
                          onClick={() =>
                            setSession((s) =>
                              s ? { ...s, revealed: true } : null,
                            )
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
                                {intervalLabel(currentCard.schedule, i + 1)}
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
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  detail,
}: {
  icon: string;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <span className="stat-icon">
        <Icon name={icon} size={21} />
      </span>
      <div>
        <div className="stat-top">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
        <p>{detail}</p>
      </div>
    </div>
  );
}
function DeckTile({
  deck,
  workspace,
  open,
}: {
  deck: Deck;
  workspace: Workspace;
  open: () => void;
}) {
  const cards = workspace.cards.filter((c) => c.deckId === deck.id);
  const ready = studyQueue(workspace, deck.id).length;
  return (
    <button className="deck-tile" onClick={open}>
      <span className={`deck-cover ${deck.color}`}>
        <span className="mini-stack">
          <span />
          <span />
          <span>
            <Icon name="cards" size={28} />
          </span>
        </span>
        <span className="cover-spark">✳</span>
        <span className="cover-caption">A COLLECTION OF CURIOSITIES</span>
      </span>
      <span className="deck-tile-body">
        <strong>{deck.name}</strong>
        <span className="deck-meta">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
          <span className={ready ? "ready-tag" : "muted"}>
            {ready ? `${ready} ready` : "All caught up"}
            <Icon name="arrow" size={15} />
          </span>
        </span>
      </span>
    </button>
  );
}
