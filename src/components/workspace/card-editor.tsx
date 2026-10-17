"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/icon";
import { useWorkspace } from "./workspace-context";
import { plainDocument, type RichNode } from "@/lib/rich-content";
import type { StudyCard } from "@/lib/study";
const RichEditor = dynamic(
  () => import("@/components/editor/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => <p className="form-hint">Opening the rich editor…</p>,
  },
);
function images(node: RichNode): RichNode[] {
  return node.type === "image" ? [node] : node.content?.flatMap(images) || [];
}
export function CardEditor({
  card,
  deckId,
}: {
  card?: StudyCard;
  deckId: string;
}) {
  const { workspace, busy, mutate, setModal, setError, setNotice } =
    useWorkspace();
  const [question, setQuestion] = useState(card?.question || "");
  const [answer, setAnswer] = useState(card?.answer || "");
  const [questionRich, setQuestionRich] = useState<RichNode | null>(
    card?.questionRich || null,
  );
  const [answerRich, setAnswerRich] = useState<RichNode | null>(
    card?.answerRich || null,
  );
  const [uploading, setUploading] = useState(false);
  const rich = workspace.preferences.editorMode === "rich";
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const qDoc = rich
          ? questionRich || plainDocument(question)
          : question === card?.question
            ? card?.questionRich || null
            : card?.questionRich
              ? plainDocument(question)
              : null;
        let aDoc = rich
          ? answerRich || plainDocument(answer)
          : answer === card?.answer
            ? card?.answerRich || null
            : card?.answerRich
              ? plainDocument(answer)
              : null;
        if (!rich && card?.answerRich && answer !== card.answer) {
          aDoc = plainDocument(answer);
          aDoc.content?.push(...images(card.answerRich));
        }
        const values = {
          question,
          answer,
          questionRich: qDoc,
          answerRich: aDoc,
        };
        if (
          await mutate(
            card
              ? {
                  type: "updateCard",
                  id: card.id,
                  version: card.version,
                  ...values,
                }
              : { type: "createCard", deckId, ...values },
          )
        ) {
          setModal(null);
          setNotice("Saved. A little more knowledge, ready to practice.");
        }
      }}
    >
      <p className="modal-description">
        {rich
          ? "Make the idea clear. Add structure, emphasis, and images where they help."
          : "Keep it focused. One idea is enough."}
      </p>
      <div className="field">
        <label htmlFor={rich ? undefined : "card-question"}>Question</label>
        {rich ? (
          <RichEditor
            label="Question"
            value={questionRich}
            text={question}
            onChange={(doc, text) => {
              setQuestionRich(doc);
              setQuestion(text);
            }}
          />
        ) : (
          <textarea
            id="card-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to recall?"
            maxLength={2000}
            rows={3}
            required
          />
        )}
      </div>
      <div className="field">
        <label htmlFor={rich ? undefined : "card-answer"}>Answer</label>
        {rich ? (
          <RichEditor
            label="Answer"
            value={answerRich}
            text={answer}
            allowImages
            onBusyChange={setUploading}
            onChange={(doc, text) => {
              setAnswerRich(doc);
              setAnswer(text);
            }}
          />
        ) : (
          <textarea
            id="card-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="A clear answer, in your own words."
            maxLength={10000}
            rows={4}
            required={!card?.answerRich}
          />
        )}
      </div>
      {!rich && (
        <p className="form-hint">
          Choose Rich / advanced in Preferences for formatting and answer
          images.
          {(card?.questionRich || card?.answerRich) &&
            " Existing formatting is kept for unchanged fields; changed text becomes plain, and attached images are preserved."}
        </p>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="button"
          disabled={busy || uploading}
          onClick={() => {
            setModal(null);
            setError("");
          }}
        >
          Cancel
        </button>
        <button className="button primary" disabled={busy || uploading}>
          {busy ? "Saving…" : uploading ? "Uploading…" : "Save card"}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}
