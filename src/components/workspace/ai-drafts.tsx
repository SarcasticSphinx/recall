"use client";
import { useState } from "react";
import { Sparkles, LoaderCircle, FileText, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "./workspace-context";
import { notesSchema, draftSchema } from "@/lib/ai/drafts";
type Draft = {
  id: string;
  question: string;
  answer: string;
  selected: boolean;
};
export function AiDrafts({ deckId }: { deckId: string }) {
  const { workspace, isPreview, aiEnabled, mutate, busy, setModal, setNotice } =
    useWorkspace();
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sourceRequestId, setSourceRequestId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const selected = drafts.filter((d) => d.selected);
  async function generate() {
    const valid = notesSchema.safeParse({ deckId, notes });
    if (!valid.success) {
      setError(valid.error.issues[0].message);
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid.data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Could not create drafts.");
      const parsed = draftSchema.parse(result);
      setDrafts(
        parsed.cards.map((d) => ({
          ...d,
          id: crypto.randomUUID(),
          selected: true,
        })),
      );
      setSourceRequestId(result.sourceRequestId);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "AI is unavailable. Your notes are safe here.",
      );
    } finally {
      setGenerating(false);
    }
  }
  return (
    <div className="ai-drafting">
      <p className="modal-description">
        Turn a page of notes into a few focused questions for{" "}
        <strong>{workspace.decks.find((d) => d.id === deckId)?.name}</strong>.
        Always check AI drafts against your source.
      </p>
      {!drafts.length ? (
        <>
          <label className="field">
            Your study notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              maxLength={12000}
              placeholder="Paste a passage, a lecture summary, or something you want to remember…"
              disabled={generating}
            />
          </label>
          <div className="notes-meta">
            <span>
              <FileText size={14} /> {notes.length.toLocaleString()} / 12,000
              characters
            </span>
            <Badge variant="secondary">UP TO 5 CARDS</Badge>
          </div>
          <p className="ai-disclosure">
            Generate sends these notes to OpenRouter and the configured model
            provider. The source is saved privately with your account so you can
            check generated cards later. Limited to 5 requests per 24 hours;
            failed attempts also count.
          </p>
          {(isPreview || !aiEnabled) && (
            <div className="setup-note">
              {isPreview
                ? "Sign in to use AI drafts. You can keep writing your notes here."
                : "Add your OpenRouter API key and a model supporting structured outputs to enable drafting."}
            </div>
          )}
          <button
            className="button primary ai-generate"
            disabled={
              isPreview || !aiEnabled || generating || notes.trim().length < 80
            }
            onClick={() => void generate()}
          >
            {generating ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}{" "}
            {generating ? "Finding the questions…" : "Generate drafts"}
          </button>
        </>
      ) : (
        <>
          <div className="draft-summary">
            <Badge variant="secondary">REVIEW BEFORE SAVING</Badge>
            <span>
              {selected.length} of {drafts.length} selected
            </span>
          </div>
          {drafts.map((draft, i) => (
            <article className="ai-draft-card" key={draft.id}>
              <div className="draft-selection">
                <Checkbox
                  id={`draft-${draft.id}`}
                  checked={draft.selected}
                  onCheckedChange={(checked) =>
                    setDrafts((all) =>
                      all.map((d) =>
                        d.id === draft.id
                          ? { ...d, selected: checked === true }
                          : d,
                      ),
                    )
                  }
                />
                <label htmlFor={`draft-${draft.id}`}>Card {i + 1}</label>
              </div>
              <label className="field">
                Question
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={draft.question}
                  onChange={(e) =>
                    setDrafts((all) =>
                      all.map((d) =>
                        d.id === draft.id
                          ? { ...d, question: e.target.value }
                          : d,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Answer
                <textarea
                  rows={3}
                  maxLength={10000}
                  value={draft.answer}
                  onChange={(e) =>
                    setDrafts((all) =>
                      all.map((d) =>
                        d.id === draft.id
                          ? { ...d, answer: e.target.value }
                          : d,
                      ),
                    )
                  }
                />
              </label>
            </article>
          ))}
          <details className="source-notes">
            <summary>Check against your source notes</summary>
            <p>{notes}</p>
          </details>
          <div className="modal-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => {
                setDrafts([]);
                setError("");
              }}
            >
              Back to notes
            </button>
            <button
              className="button primary"
              disabled={
                busy ||
                !selected.length ||
                selected.some((d) => !d.question.trim() || !d.answer.trim())
              }
              onClick={async () => {
                if (
                  await mutate({
                    type: "createCards",
                    deckId,
                    sourceRequestId,
                    cards: selected.map(({ id, question, answer }) => ({
                      id,
                      question,
                      answer,
                    })),
                  })
                ) {
                  setModal(null);
                  setNotice(
                    `${selected.length} new questions, ready to practice.`,
                  );
                }
              }}
            >
              {busy
                ? "Saving…"
                : `Add ${selected.length} ${selected.length === 1 ? "card" : "cards"}`}
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
