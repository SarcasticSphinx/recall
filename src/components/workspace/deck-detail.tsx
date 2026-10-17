"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
const CardDataTable = dynamic(() =>
  import("./card-data-table").then((m) => m.CardDataTable),
);
import { useWorkspace } from "./workspace-context";
import { RichContent } from "@/components/editor/rich-content";
import { Icon } from "@/components/icon";
import { studyQueue } from "@/lib/study";
export function DeckDetail() {
  const {
    workspace,
    deck,
    deckCards,
    setSelectedDeck,
    setSearch,
    setError,
    setModal,
    startStudy,
    search,
  } = useWorkspace();
  const [cardView, setCardView] = useState("cards");
  const filtered = deckCards.filter((c) =>
    `${c.question} ${c.answer}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
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
          <h1>{deck!.name}</h1>
          <p>Small questions. Deeper understanding.</p>
        </div>
        <div className="heading-actions">
          <button
            className="icon-button"
            aria-label="Edit deck"
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
                id: deck!.id,
                name: deck!.name,
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
          onClick={() => startStudy(deck!.id)}
          disabled={!studyQueue(workspace, deck!.id).length}
        >
          Review {studyQueue(workspace, deck!.id).length}{" "}
          {studyQueue(workspace, deck!.id).length === 1 ? "card" : "cards"}
          <Icon name="arrow" size={17} />
        </button>
        <button
          className="button primary"
          onClick={() => {
            setError("");
            setModal({ type: "card", deckId: deck!.id });
          }}
        >
          <Icon name="plus" size={17} />
          Add card
        </button>
      </div>
      <Tabs value={cardView} onValueChange={setCardView}>
        <div className="collection-tools">
          <TabsList aria-label="Card view">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <button
            className="button"
            onClick={() => {
              setError("");
              setModal({ type: "ai", deckId: deck!.id });
            }}
          >
            <Icon name="spark" size={16} />
            Draft with AI
          </button>
        </div>
        <TabsContent value="table">
          <CardDataTable key={search} cards={filtered} />
        </TabsContent>
        <TabsContent value="cards">
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
                    <div className="card-question">
                      <RichContent
                        document={card.questionRich}
                        text={card.question}
                      />
                    </div>
                    <RichContent
                      document={card.answerRich}
                      text={card.answer}
                    />
                    {card.sourceNotes && (
                      <details className="source-notes">
                        <summary>Source notes · AI assisted</summary>
                        <p>{card.sourceNotes}</p>
                      </details>
                    )}
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
                        setModal({ type: "card", deckId: deck!.id, card });
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
                  onClick={() => setModal({ type: "card", deckId: deck!.id })}
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
        </TabsContent>
      </Tabs>
    </>
  );
}
