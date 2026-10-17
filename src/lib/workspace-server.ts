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
import type { RichNode } from "./rich-content";
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
      select: { timezone: true, newCardLimit: true, editorMode: true },
    }),
    db.deck.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        cards: {
          orderBy: { createdAt: "asc" },
          include: { sourceRequest: { select: { notes: true } } },
        },
      },
    }),
    db.review.findMany({
      where: {
        userId,
        reviewedAt: { gte: new Date(Date.now() - 8 * 24 * 3600000) },
      },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);
  return {
    decks: decks.map(({ id, name, color, icon, imageUrl }) => ({
      id,
      name,
      color,
      icon,
      imageUrl,
    })),
    cards: decks.flatMap((deck) =>
      deck.cards.map((card) => ({
        id: card.id,
        deckId: deck.id,
        sourceNotes: card.sourceRequest?.notes || null,
        question: card.question,
        answer: card.answer,
        questionRich: card.questionRich as RichNode | null,
        answerRich: card.answerRich as RichNode | null,
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
      mode: r.mode === "practice" ? "practice" : "scheduled",
      reviewedAt: r.reviewedAt.toISOString(),
    })),
    preferences: {
      ...user,
      editorMode: user.editorMode === "rich" ? "rich" : "simple",
    },
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
        data: {
          userId,
          name: action.name,
          color: action.color,
          icon: action.icon,
          imageUrl: action.imageUrl,
        },
      });
      break;
    case "updateDeck": {
      const result = await db.deck.updateMany({
        where: { id: action.id, userId },
        data: {
          name: action.name,
          color: action.color,
          icon: action.icon,
          imageUrl: action.imageUrl,
        },
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
          questionRich: action.questionRich
            ? json(action.questionRich)
            : Prisma.DbNull,
          answerRich: action.answerRich
            ? json(action.answerRich)
            : Prisma.DbNull,
          schedule: json(newSchedule()),
        },
      });
      break;
    case "createCards":
      await db.$transaction(async (tx) => {
        if (
          !(await tx.deck.findFirst({
            where: { id: action.deckId, userId },
            select: { id: true },
          }))
        )
          throw new WorkspaceError("Deck not found.", 404);
        if (
          !(await tx.aiRequest.findFirst({
            where: { id: action.sourceRequestId, userId },
            select: { id: true },
          }))
        )
          throw new WorkspaceError("Draft source not found.", 404);
        // Stable draft UUIDs make a repeated save safe after a lost response.
        await tx.card.createMany({
          data: action.cards.map((card) => ({
            ...card,
            deckId: action.deckId,
            sourceRequestId: action.sourceRequestId,
            schedule: json(newSchedule()),
          })),
          skipDuplicates: true,
        });
        const saved = await tx.card.findMany({
          where: { id: { in: action.cards.map((card) => card.id) } },
          select: {
            id: true,
            deckId: true,
            question: true,
            answer: true,
            sourceRequestId: true,
            deck: { select: { userId: true } },
          },
        });
        if (
          saved.some((card) => {
            const draft = action.cards.find((d) => d.id === card.id)!;
            return (
              card.deck.userId !== userId ||
              card.deckId !== action.deckId ||
              card.sourceRequestId !== action.sourceRequestId ||
              card.question !== draft.question ||
              card.answer !== draft.answer
            );
          })
        )
          throw new WorkspaceError(
            "Some drafts were already saved with different content. Refresh your workspace before editing them.",
            409,
          );
      });
      break;
    case "updateCard": {
      const result = await db.card.updateMany({
        where: { id: action.id, version: action.version, deck: { userId } },
        data: {
          question: action.question,
          answer: action.answer,
          questionRich: action.questionRich
            ? json(action.questionRich)
            : Prisma.DbNull,
          answerRich: action.answerRich
            ? json(action.answerRich)
            : Prisma.DbNull,
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
            editorMode: action.editorMode,
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
              existing.cardVersion !== action.version ||
              existing.mode !== (action.mode || "scheduled")
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
          if (action.mode === "practice") {
            await tx.review.create({
              data: {
                userId,
                cardId: card.id,
                operationId: action.operationId,
                cardVersion: action.version,
                rating: action.rating,
                mode: "practice",
                wasNew: false,
                reviewedAt: new Date(),
                nextSchedule: json(card.schedule),
              },
            });
            return;
          }
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
            preferences: {
              ...user,
              editorMode: user.editorMode === "rich" ? "rich" : "simple",
            },
            reviews: recent.map((r) => ({
              ...r,
              mode: r.mode === "practice" ? "practice" : "scheduled",
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
