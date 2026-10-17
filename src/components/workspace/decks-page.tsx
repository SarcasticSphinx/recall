"use client";
import { usePageCopy } from "@/hooks/use-page-copy";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { DeckTile } from "./deck-tile";
export function DecksPage() {
  const { workspace, setSelectedDeck, setSearch, setError, setModal } =
    useWorkspace();
  const copy = usePageCopy();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">COLLECT YOUR CURIOSITY</div>
          <h1>{copy.decks[0]}</h1>
          <p>{copy.decks[1]}</p>
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
  );
}
