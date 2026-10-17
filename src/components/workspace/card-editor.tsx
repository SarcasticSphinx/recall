"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/icon";
import { useWorkspace } from "./workspace-context";
import {
  plainDocument,
  editPlainDocument,
  attachImage,
  type RichNode,
} from "@/lib/rich-content";
import { ImageUpload } from "@/components/editor/image-upload";
import { RichContent } from "@/components/editor/rich-content";
import type { StudyCard } from "@/lib/study";
const RichEditor = dynamic(
  () => import("@/components/editor/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => <p className="form-hint">Opening the rich editor…</p>,
  },
);
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
  const [questionUploading, setQuestionUploading] = useState(false);
  const [answerUploading, setAnswerUploading] = useState(false);
  const uploading = questionUploading || answerUploading;
  const rich = workspace.preferences.editorMode === "rich";
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const qDoc = rich
          ? questionRich || plainDocument(question)
          : editPlainDocument(question, questionRich);
        const aDoc = rich
          ? answerRich || plainDocument(answer)
          : editPlainDocument(answer, answerRich);
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
            purpose="question"
            onBusyChange={setQuestionUploading}
            value={questionRich}
            text={question}
            onChange={(doc, text) => {
              setQuestionRich(doc);
              setQuestion(text);
            }}
          />
        ) : (
          <>
            <textarea
              id="card-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to recall?"
              maxLength={2000}
              rows={3}
              required
            />
            <ImageUpload
              purpose="question"
              label="Add question image"
              onBusyChange={setQuestionUploading}
              onUpload={(url) =>
                setQuestionRich(
                  attachImage(
                    question,
                    questionRich,
                    url,
                    "Question illustration",
                  ),
                )
              }
            />
            <AttachmentPreview document={questionRich} />
          </>
        )}
      </div>
      <div className="field">
        <label htmlFor={rich ? undefined : "card-answer"}>Answer</label>
        {rich ? (
          <RichEditor
            label="Answer"
            purpose="answer"
            value={answerRich}
            text={answer}
            onBusyChange={setAnswerUploading}
            onChange={(doc, text) => {
              setAnswerRich(doc);
              setAnswer(text);
            }}
          />
        ) : (
          <>
            <textarea
              id="card-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="A clear answer, in your own words."
              maxLength={10000}
              rows={4}
              required={!answerRich}
            />
            <ImageUpload
              purpose="answer"
              label="Add answer image"
              onBusyChange={setAnswerUploading}
              onUpload={(url) =>
                setAnswerRich(
                  attachImage(answer, answerRich, url, "Answer illustration"),
                )
              }
            />
            <AttachmentPreview document={answerRich} />
          </>
        )}
      </div>
      {!rich && (
        <p className="form-hint">
          Choose Canvas in Preferences for text formatting. Images work in both
          editors.
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

function AttachmentPreview({ document }: { document?: RichNode | null }) {
  function images(node: RichNode): RichNode[] {
    return node.type === "image" ? [node] : node.content?.flatMap(images) || [];
  }
  const attached = document ? images(document) : [];
  return attached.length ? (
    <div className="attachment-preview">
      <RichContent document={{ type: "doc", content: attached }} text="" />
    </div>
  ) : null;
}
