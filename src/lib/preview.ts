import {
  newSchedule,
  nextSchedule,
  studyQueue,
  type Workspace,
} from "./study.ts";
import type { WorkspaceAction } from "./validation";

export function createPreview(): Workspace {
  const now = new Date();
  const decks = [
    { id: "foundations", name: "Learning how to learn", color: "indigo" },
    { id: "everyday", name: "A curious mind", color: "sage" },
  ];
  const entries = [
    [
      "foundations",
      "What is active recall?",
      "Retrieving information from memory before looking at the answer. The attempt to remember is the practice.",
    ],
    [
      "foundations",
      "Why space out your practice?",
      "Returning to material over time gives you repeated opportunities to retrieve it, rather than relying on familiarity from one long session.",
    ],
    [
      "foundations",
      "What makes a useful flashcard?",
      "One focused question with a clear answer. If a card asks several things at once, split it into smaller cards.",
    ],
    [
      "foundations",
      "How is recognition different from recall?",
      "Recognition is noticing that an answer looks familiar. Recall is producing the answer yourself.",
    ],
    [
      "everyday",
      "What does a growth mindset emphasize?",
      "Abilities can develop through practice, useful feedback, and better strategies.",
    ],
    [
      "everyday",
      "What is the Feynman technique?",
      "Explain an idea simply, notice the gaps in your explanation, revisit the material, and try again.",
    ],
  ];
  return {
    decks,
    cards: entries.map(([deckId, question, answer], i) => ({
      id: `sample-${i}`,
      deckId,
      question,
      answer,
      schedule: newSchedule(now),
      version: 0,
      createdAt: new Date(now.getTime() + i).toISOString(),
    })),
    reviews: [],
    preferences: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      newCardLimit: 20,
    },
  };
}
export function applyPreview(
  workspace: Workspace,
  action: WorkspaceAction,
): Workspace {
  const next: Workspace = structuredClone(workspace);
  switch (action.type) {
    case "createDeck":
      next.decks.push({
        id: crypto.randomUUID(),
        name: action.name,
        color: action.color,
        icon: action.icon || "cards",
        imageUrl: action.imageUrl || null,
      });
      break;
    case "updateDeck":
      next.decks = next.decks.map((d) =>
        d.id === action.id
          ? {
              ...d,
              name: action.name,
              color: action.color || d.color,
              icon: action.icon || d.icon,
              imageUrl:
                action.imageUrl === undefined ? d.imageUrl : action.imageUrl,
            }
          : d,
      );
      break;
    case "deleteDeck": {
      const removed = new Set(
        next.cards.filter((c) => c.deckId === action.id).map((c) => c.id),
      );
      next.decks = next.decks.filter((d) => d.id !== action.id);
      next.cards = next.cards.filter((c) => !removed.has(c.id));
      next.reviews = next.reviews.map((r) =>
        removed.has(r.cardId || "") ? { ...r, cardId: null } : r,
      );
      break;
    }
    case "createCard":
      next.cards.push({
        id: crypto.randomUUID(),
        deckId: action.deckId,
        question: action.question,
        answer: action.answer,
        questionRich: action.questionRich || null,
        answerRich: action.answerRich || null,
        schedule: newSchedule(),
        version: 0,
        createdAt: new Date().toISOString(),
      });
      break;
    case "createCards":
      if (!next.decks.some((d) => d.id === action.deckId))
        throw new Error("Deck not found.");
      for (const card of action.cards) {
        const existing = next.cards.find((c) => c.id === card.id);
        if (
          existing &&
          (existing.deckId !== action.deckId ||
            existing.question !== card.question ||
            existing.answer !== card.answer)
        )
          throw new Error(
            "Some drafts were already saved with different content. Refresh before editing them.",
          );
        if (!existing)
          next.cards.push({
            ...card,
            deckId: action.deckId,
            schedule: newSchedule(),
            version: 0,
            createdAt: new Date().toISOString(),
          });
      }
      break;
    case "updateCard": {
      const card = next.cards.find((c) => c.id === action.id);
      if (!card || card.version !== action.version)
        throw new Error("This card changed. Refresh before editing again.");
      Object.assign(card, {
        question: action.question,
        answer: action.answer,
        questionRich: action.questionRich || null,
        answerRich: action.answerRich || null,
        version: card.version + 1,
      });
      break;
    }
    case "deleteCard":
      next.cards = next.cards.filter((c) => c.id !== action.id);
      next.reviews = next.reviews.map((r) =>
        r.cardId === action.id ? { ...r, cardId: null } : r,
      );
      break;
    case "preferences":
      next.preferences = {
        timezone: action.timezone,
        newCardLimit: action.newCardLimit,
        editorMode:
          action.editorMode || next.preferences.editorMode || "simple",
      };
      break;
    case "review": {
      const existing = next.reviews.find(
        (r) => r.operationId === action.operationId,
      );
      if (existing) {
        if (
          existing.cardId !== action.id ||
          existing.rating !== action.rating ||
          existing.cardVersion !== action.version ||
          (existing.mode || "scheduled") !== (action.mode || "scheduled")
        )
          throw new Error("This review identifier has already been used.");
        return next;
      }
      const card = next.cards.find((c) => c.id === action.id);
      if (!card || card.version !== action.version)
        throw new Error("This card changed. Refresh to continue.");
      if (
        action.mode !== "practice" &&
        !studyQueue(next).some((c) => c.id === action.id)
      )
        throw new Error("This card is not ready to review.");
      next.reviews.push({
        operationId: action.operationId,
        cardId: card.id,
        cardVersion: card.version,
        rating: action.rating,
        mode: action.mode || "scheduled",
        wasNew: action.mode !== "practice" && card.schedule.reps === 0,
        reviewedAt: new Date().toISOString(),
      });
      if (action.mode !== "practice") {
        card.schedule = nextSchedule(card.schedule, action.rating);
        card.version += 1;
      }
      break;
    }
  }
  return next;
}
