"use client";
import { usePageCopy } from "@/hooks/use-page-copy";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { DeckTile } from "./deck-tile";
import { Stat } from "./stat";
export function TodayPage() {
  const {
    workspace,
    queue,
    todaysReviews,
    dueCount,
    newCount,
    navigate,
    setSelectedDeck,
    setError,
    setModal,
    startStudy,
  } = useWorkspace();
  const copy = usePageCopy();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE EVERY DAY</div>
          <h1>{copy.today[0]}</h1>
          <p>{copy.today[1]}</p>
        </div>
        <span className="heading-spark" aria-hidden="true">
          <Icon name="spark" size={42} />
        </span>
      </div>
      <section className="practice-hero" aria-labelledby="practice-title">
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
                <strong>{queue.length} cards</strong> are ready for a little
                attention.
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
            onClick={() => (queue.length ? startStudy() : navigate("decks"))}
          >
            {queue.length ? "Start today's review" : "Explore your decks"}
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
          <span className="art-spark">
            <Icon name="spark" size={28} />
          </span>
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
              A LITTLE PRACTICE GOES A LONG WAY <Icon name="spark" size={18} />
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
            <span className="subtle-count">{workspace.decks.length}</span>
          </h2>
          <p>A home for everything you&apos;re learning.</p>
        </div>
        <button className="text-button" onClick={() => navigate("decks")}>
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
          You don&apos;t have to remember everything today. Just keep showing
          up.
        </span>
      </footer>
    </>
  );
}
