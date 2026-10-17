import { studyQueue, type StudyCard, type Workspace } from "./study.ts";
export type ReviewMode = "scheduled" | "practice";
export type CardFilter = "all" | "due" | "new" | "learning" | "difficult";
export function reviewCandidates(
  workspace: Workspace,
  {
    mode,
    deckId,
    query = "",
    filter = "all",
  }: { mode: ReviewMode; deckId?: string; query?: string; filter?: CardFilter },
  now = new Date(),
): StudyCard[] {
  const cards =
    mode === "scheduled"
      ? studyQueue(workspace, deckId, now)
      : workspace.cards.filter((card) => !deckId || card.deckId === deckId);
  const term = query.trim().toLocaleLowerCase();
  return cards.filter((card) => {
    if (
      term &&
      !`${card.question} ${card.answer}`.toLocaleLowerCase().includes(term)
    )
      return false;
    if (filter === "due")
      return card.schedule.reps > 0 && new Date(card.schedule.due) <= now;
    if (filter === "new") return card.schedule.reps === 0;
    if (filter === "learning")
      return card.schedule.reps > 0 && [1, 3].includes(card.schedule.state);
    if (filter === "difficult") return card.schedule.lapses > 0;
    return true;
  });
}
export function selectedReviewCards(
  workspace: Workspace,
  options: {
    mode: ReviewMode;
    ids: string[];
    shuffle?: boolean;
    limit?: number;
  },
  now = new Date(),
  random = Math.random,
) {
  const allowed = new Set(options.ids);
  const cards = reviewCandidates(workspace, { mode: options.mode }, now).filter(
    (card) => allowed.has(card.id),
  );
  if (options.shuffle)
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  return cards.slice(
    0,
    options.limit === undefined
      ? cards.length
      : Math.max(0, Math.floor(options.limit)),
  );
}
