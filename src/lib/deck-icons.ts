export const deckIconNames = [
  "cards",
  "book",
  "brain",
  "code",
  "languages",
  "science",
  "heart",
  "globe",
  "music",
  "graduation",
  "lightbulb",
  "target",
] as const;
export type DeckIconName = (typeof deckIconNames)[number];
