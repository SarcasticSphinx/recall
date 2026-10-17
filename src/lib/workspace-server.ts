import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "./db";
import {
  newSchedule,
  nextSchedule,
  studyQueue,
  type Schedule,
  type Workspace,
} from "./study";
import type { WorkspaceAction } from "./validation";

export class WorkspaceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function loadWorkspace(
  userId: string,
  db = getDb(),
): Promise<Workspace> {
  const [user, decks, reviews] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true, newCardLimit: true },
    }),
    db.deck.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { cards: { orderBy: { createdAt: "asc" } } },
    }),
    db.review.findMany({
      where: {
        userId,
        reviewedAt: { gte: new Date(Date.now() - 48 * 3600000) },
      },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);
  return {
    decks: decks.map(({ id, name, color }) => ({ id, name, color })),
    cards: decks.flatMap((deck) =>
      deck.cards.map((card) => ({
        id: card.id,
        deckId: deck.id,
        question: card.question,
        answer: card.answer,
        schedule: card.schedule as Schedule,
        version: card.version,
        createdAt: card.createdAt.toISOString(),
      })),
    ),
    reviews: reviews.map((r) => ({
      operationId: r.operationId,
      cardId: r.cardId,
      cardVersion: r.cardVersion,
      rating: r.rating,
      wasNew: r.wasNew,
      reviewedAt: r.reviewedAt.toISOString(),
    })),
    preferences: user,
  };
}

export async function applyAction(userId: string, action: WorkspaceAction) {
  const db = getDb();
  const ownsDeck = async (id: string) => {
    if (
      !(await db.deck.findFirst({
        where: { id, userId },
        select: { id: true },
      }))
    )
      throw new WorkspaceError("Deck not found.", 404);
  };
  switch (action.type) {
    case "createDeck":
      await db.deck.create({
        data: { userId, name: action.name, color: action.color },
      });
      break;
    case "updateDeck": {
      const result = await db.deck.updateMany({
        where: { id: action.id, userId },
        data: { name: action.name },
      });
      if (!result.count) throw new WorkspaceError("Deck not found.", 404);
      break;
    }
    case "deleteDeck": {
      const result = await db.deck.deleteMany({
        where: { id: action.id, userId },
      });
      if (!result.count) throw new WorkspaceError("Deck not found.", 404);
      break;
    }
    case "createCard":
      await ownsDeck(action.deckId);
      await db.card.create({
        data: {
          deckId: action.deckId,
          question: action.question,
          answer: action.answer,
          schedule: json(newSchedule()),
        },
      });
      break;
    case "updateCard": {
      const result = await db.card.updateMany({
        where: { id: action.id, version: action.version, deck: { userId } },
        data: {
          question: action.question,
          answer: action.answer,
          version: { increment: 1 },
        },
      });
      if (!result.count)
        throw new WorkspaceError(
          "This card changed or was removed. Refresh before editing again.",
          409,
        );
      break;
    }
    case "deleteCard": {
      const result = await db.card.deleteMany({
        where: { id: action.id, deck: { userId } },
      });
      if (!result.count) throw new WorkspaceError("Card not found.", 404);
      break;
    }
    case "preferences":
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`;
        await tx.user.update({
          where: { id: userId },
          data: {
            timezone: action.timezone,
            newCardLimit: action.newCardLimit,
          },
        });
      });
      break;
    case "review":
      await db.$transaction(
        async (tx) => {
          // Serialize a learner's reviews so concurrent devices share the daily limit.
          await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`;
          const existing = await tx.review.findUnique({
            where: {
              userId_operationId: { userId, operationId: action.operationId },
            },
          });
          if (existing) {
            if (
              existing.cardId !== action.id ||
              existing.rating !== action.rating ||
              existing.cardVersion !== action.version
            ) {
              throw new WorkspaceError(
                "This review identifier has already been used.",
                409,
              );
            }
            return;
          }
          const card = await tx.card.findFirst({
            where: { id: action.id, deck: { userId } },
          });
          if (!card) throw new WorkspaceError("Card not found.", 404);
          if (card.version !== action.version)
            throw new WorkspaceError(
              "This card changed on another device. Refresh to continue.",
              409,
            );
          const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
          });
          const recent = await tx.review.findMany({
            where: {
              userId,
              reviewedAt: { gte: new Date(Date.now() - 48 * 3600000) },
            },
          });
          const now = new Date();
          const current = {
            id: card.id,
            deckId: card.deckId,
            question: card.question,
            answer: card.answer,
            schedule: card.schedule as Schedule,
            version: card.version,
            createdAt: card.createdAt.toISOString(),
          };
          const workspace: Workspace = {
            cards: [current],
            decks: [],
            preferences: user,
            reviews: recent.map((r) => ({
              ...r,
              reviewedAt: r.reviewedAt.toISOString(),
            })),
          };
          if (!studyQueue(workspace, undefined, now).length)
            throw new WorkspaceError(
              "This card is not ready to review or your daily new-card limit has been reached.",
              409,
            );
          const schedule = nextSchedule(current.schedule, action.rating, now);
          const updated = await tx.card.updateMany({
            where: { id: card.id, version: action.version },
            data: {
              schedule: json(schedule),
              due: new Date(schedule.due),
              repetitions: schedule.reps,
              version: { increment: 1 },
            },
          });
          if (!updated.count)
            throw new WorkspaceError(
              "This card changed. Refresh to continue.",
              409,
            );
          await tx.review.create({
            data: {
              userId,
              cardId: card.id,
              operationId: action.operationId,
              cardVersion: action.version,
              rating: action.rating,
              wasNew: current.schedule.reps === 0,
              reviewedAt: now,
              nextSchedule: json(schedule),
            },
          });
        },
        { timeout: 15000 },
      );
      break;
  }
}
