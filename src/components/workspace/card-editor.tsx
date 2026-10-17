"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/icon";
import { useWorkspace } from "./workspace-context";
import {
  plainDocument,
  editPlainDocument,
  attachImage,
  richText,
  type RichNode,
} from "@/lib/rich-content";
import type { RichEditorHandle } from "@/components/editor/rich-editor";
import { usePendingImages } from "@/hooks/use-pending-images";
import { actionSchema } from "@/lib/validation";
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
  const media = usePendingImages();
  const questionEditor = useRef<RichEditorHandle>(null);
  const answerEditor = useRef<RichEditorHandle>(null);
  const uploading = media.saving;
  const rich = workspace.preferences.editorMode === "rich";
  return (
    <form
      className="editor-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await media.save(async () => {
          const qDoc = rich
            ? questionEditor.current?.readDocument() ||
              questionRich ||
              plainDocument(question)
            : editPlainDocument(question, questionRich);
          const aDoc = rich
            ? answerEditor.current?.readDocument() ||
              answerRich ||
              plainDocument(answer)
            : editPlainDocument(answer, answerRich);
          const values = {
            question: rich && qDoc ? richText(qDoc) : question,
            answer: rich && aDoc ? richText(aDoc) : answer,
          };
          const identity = card
            ? {
                type: "updateCard" as const,
                id: card.id,
                version: card.version,
              }
            : { type: "createCard" as const, deckId };
          // Catch invalid text or structure before uploading any selected files.
          actionSchema.parse({
            ...identity,
            ...values,
            questionRich: media.forValidation(qDoc),
            answerRich: media.forValidation(aDoc),
          });
          const savedQuestion = await media.resolveDocument(qDoc, "question");
          const savedAnswer = await media.resolveDocument(aDoc, "answer");
          if (
            await mutate({
              ...identity,
              ...values,
              questionRich: savedQuestion,
              answerRich: savedAnswer,
            })
          ) {
            setModal(null);
            setNotice("Saved. A little more knowledge, ready to practice.");
          }
        });
      }}
    >
      <div className="editor-fields">
        <fieldset className="editor-fields-inner" disabled={busy || uploading}>
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
                handle={questionEditor}
                onSelectImage={media.stage}
                disabled={uploading}
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
                <div
                  className="rich-toolbar focus-image-toolbar"
                  role="toolbar"
                  aria-label="Question tools"
                >
                  <ImageUpload
                    purpose="question"
                    disabled={uploading}
                    onSelect={(file) =>
                      setQuestionRich(
                        attachImage(
                          question,
                          questionRich,
                          media.stage(file),
                          "Question illustration",
                        ),
                      )
                    }
                  />
                </div>
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
                handle={answerEditor}
                onSelectImage={media.stage}
                disabled={uploading}
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
                <div
                  className="rich-toolbar focus-image-toolbar"
                  role="toolbar"
                  aria-label="Answer tools"
                >
                  <ImageUpload
                    purpose="answer"
                    disabled={uploading}
                    onSelect={(file) =>
                      setAnswerRich(
                        attachImage(
                          answer,
                          answerRich,
                          media.stage(file),
                          "Answer illustration",
                        ),
                      )
                    }
                  />
                </div>
                <AttachmentPreview document={answerRich} />
              </>
            )}
          </div>
          {!rich && (
            <p className="form-hint">
              Choose Canvas in Preferences for text formatting. Images work in
              both editors.
              {(card?.questionRich || card?.answerRich) &&
                " Existing formatting is kept for unchanged fields; changed text becomes plain, and attached images are preserved."}
            </p>
          )}
          <p className="form-hint">
            Images stay on this device until you save.
          </p>
        </fieldset>
      </div>
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
