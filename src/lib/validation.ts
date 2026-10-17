import { z } from "zod";
import {
  cloudinaryImageUrl,
  questionDocumentSchema,
  richDocumentSchema,
  richText,
  hasImages,
} from "./rich-content.ts";
import { deckIconNames } from "./deck-icons.ts";

export const colors = ["indigo", "peach", "sage", "rose"] as const;
const id = z.string().min(1).max(128);
const name = z.string().trim().min(1, "Give your deck a name.").max(80);
const question = z.string().trim().max(2000);
const answer = z.string().trim().max(10000);
const richFields = {
  questionRich: questionDocumentSchema.nullable().optional(),
  answerRich: richDocumentSchema.nullable().optional(),
};
const deckFields = {
  icon: z.enum(deckIconNames).optional(),
  imageUrl: cloudinaryImageUrl.nullable().optional(),
};
const timezone = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone.");

export const actionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("createDeck"),
      name,
      color: z.enum(colors),
      ...deckFields,
    }),
    z.object({
      type: z.literal("updateDeck"),
      id,
      name,
      color: z.enum(colors).optional(),
      ...deckFields,
    }),
    z.object({ type: z.literal("deleteDeck"), id }),
    z.object({
      type: z.literal("createCard"),
      deckId: id,
      question,
      answer,
      ...richFields,
    }),
    z.object({
      type: z.literal("updateCard"),
      id,
      version: z.number().int().nonnegative(),
      question,
      answer,
      ...richFields,
    }),
    z.object({ type: z.literal("deleteCard"), id }),
    z.object({
      type: z.literal("review"),
      id,
      version: z.number().int().nonnegative(),
      rating: z.number().int().min(1).max(4),
      operationId: z.string().uuid(),
    }),
    z.object({
      type: z.literal("preferences"),
      timezone,
      newCardLimit: z.number().int().min(0).max(200),
      editorMode: z.enum(["simple", "rich"]).optional(),
    }),
  ])
  .superRefine((action, ctx) => {
    if (action.type !== "createCard" && action.type !== "updateCard") return;
    if (
      !action.question.trim() ||
      (action.questionRich &&
        richText(action.questionRich).trim() !== action.question.trim())
    )
      ctx.addIssue({
        code: "custom",
        message: "Add a question and keep its formatted content consistent.",
        path: ["question"],
      });
    if (
      !action.answer.trim() &&
      !(action.answerRich && hasImages(action.answerRich))
    )
      ctx.addIssue({
        code: "custom",
        message: "Add an answer or an answer image.",
        path: ["answer"],
      });
    if (
      action.answerRich &&
      richText(action.answerRich).trim() !== action.answer.trim()
    )
      ctx.addIssue({
        code: "custom",
        message: "The formatted answer must match its text.",
        path: ["answer"],
      });
  });
export type WorkspaceAction = z.infer<typeof actionSchema>;

const isoDate = z.string().datetime();
const nonnegative = z.number().finite().nonnegative();
export const workspaceSchema = z.object({
  decks: z.array(z.object({ id, name, color: z.enum(colors), ...deckFields })),
  cards: z.array(
    z.object({
      id,
      deckId: id,
      question,
      answer,
      ...richFields,
      version: nonnegative.int(),
      createdAt: isoDate,
      schedule: z.object({
        due: isoDate,
        stability: nonnegative,
        difficulty: nonnegative,
        elapsed_days: nonnegative,
        scheduled_days: nonnegative,
        learning_steps: nonnegative.int(),
        reps: nonnegative.int(),
        lapses: nonnegative.int(),
        state: z.number().int().min(0).max(3),
        last_review: isoDate.optional(),
      }),
    }),
  ),
  reviews: z.array(
    z.object({
      operationId: z.string(),
      cardId: id.nullable(),
      cardVersion: nonnegative.int(),
      rating: z.number().int().min(1).max(4),
      wasNew: z.boolean(),
      reviewedAt: isoDate,
    }),
  ),
  preferences: z.object({
    timezone,
    newCardLimit: z.number().int().min(0).max(200),
    editorMode: z.enum(["simple", "rich"]).default("simple"),
  }),
});
