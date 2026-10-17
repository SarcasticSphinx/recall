import Image from "next/image";
import { Icon } from "@/components/icon";
import { studyQueue, type Deck, type Workspace } from "@/lib/study";
export function DeckTile({
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
        {deck.imageUrl ? (
          <Image
            src={deck.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 60px, 300px"
            unoptimized
            className="deck-cover-image"
          />
        ) : (
          <span className="mini-stack">
            <span />
            <span />
            <span>
              <Icon name={deck.icon || "cards"} size={28} />
            </span>
          </span>
        )}
        <span className="cover-spark">
          <Icon name="spark" size={22} />
        </span>
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
