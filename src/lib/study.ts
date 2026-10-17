import type { RichNode } from "./rich-content";
import { createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";

export type Schedule = Omit<Card, "due" | "last_review"> & {
  due: string;
  last_review?: string;
};
export type StudyCard = {
  id: string;
  deckId: string;
  sourceNotes?: string | null;
  question: string;
  answer: string;
  questionRich?: RichNode | null;
  answerRich?: RichNode | null;
  schedule: Schedule;
  version: number;
  createdAt: string;
};
export type Deck = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  imageUrl?: string | null;
};
export type ReviewEvent = {
  operationId: string;
  cardId: string | null;
  cardVersion: number;
  rating: number;
  wasNew: boolean;
  mode?: "scheduled" | "practice";
  reviewedAt: string;
};
export type Workspace = {
  decks: Deck[];
  cards: StudyCard[];
  reviews: ReviewEvent[];
  preferences: {
    timezone: string;
    newCardLimit: number;
    editorMode?: "simple" | "rich";
  };
};

// Fixed defaults make scheduling reproducible. Personal optimization is deferred.
const scheduler = fsrs({ enable_fuzz: false });

export function serializeSchedule(card: Card): Schedule {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review?.toISOString(),
  };
}
export function newSchedule(now = new Date()): Schedule {
  return serializeSchedule(createEmptyCard(now));
}
export function nextSchedule(
  schedule: Schedule,
  rating: number,
  now = new Date(),
): Schedule {
  if (![1, 2, 3, 4].includes(rating))
    throw new Error("Choose a valid recall rating.");
  return serializeSchedule(scheduler.next(schedule, now, rating as Grade).card);
}
export function localDay(date: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function todayReviews(
  workspace: Workspace,
  now = new Date(),
): ReviewEvent[] {
  const day = localDay(now, workspace.preferences.timezone);
  return workspace.reviews.filter(
    (r) => localDay(r.reviewedAt, workspace.preferences.timezone) === day,
  );
}
export function studyQueue(
  workspace: Workspace,
  deckId?: string,
  now = new Date(),
): StudyCard[] {
  const available = Math.max(
    0,
    workspace.preferences.newCardLimit -
      todayReviews(workspace, now).filter((r) => r.wasNew).length,
  );
  const cards = workspace.cards.filter((c) => !deckId || c.deckId === deckId);
  const due = cards
    .filter((c) => c.schedule.reps > 0 && new Date(c.schedule.due) <= now)
    .sort((a, b) => a.schedule.due.localeCompare(b.schedule.due));
  const fresh = cards
    .filter((c) => c.schedule.reps === 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, available);
  return [...due, ...fresh];
}
export function intervalLabel(
  schedule: Schedule,
  rating: number,
  now = new Date(),
): string {
  const next = nextSchedule(schedule, rating, now);
  const minutes = Math.max(
    1,
    Math.round((new Date(next.due).getTime() - now.getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}
