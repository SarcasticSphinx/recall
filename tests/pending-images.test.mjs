import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  validateImageFile,
  documentForValidation,
  resolveImageDocument,
  resolveImageSource,
  imageSources,
} from "../src/lib/pending-images.ts";
import {
  attachImage,
  plainDocument,
  richText,
} from "../src/lib/rich-content.ts";
import { actionSchema, workspaceSchema } from "../src/lib/validation.ts";
import { createPreview, applyPreview } from "../src/lib/preview.ts";
import { studyQueue } from "../src/lib/study.ts";
import { registerHooks } from "node:module";
// Next's bundler unwraps next/image's CommonJS default; Node's ESM loader does
// not. Re-export the same real Image implementation for component SSR tests.
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith("/node_modules/next/image.js"))
      return {
        format: "module",
        shortCircuit: true,
        source: `import image from ${JSON.stringify(new URL("../node_modules/next/dist/client/image-component.js", import.meta.url).href)}; export default image.Image;`,
      };
    return nextLoad(url, context);
  },
});
const { ReviewCard } =
  await import("../src/components/workspace/review-card.tsx");
const { DeckTile } = await import("../src/components/workspace/deck-tile.tsx");
const questionUrl = "https://res.cloudinary.com/demo/image/upload/question.png";
const answerUrl = "https://res.cloudinary.com/demo/image/upload/answer.png";
function file(name = "test.png") {
  return new File(["image-bytes"], name, { type: "image/png" });
}
function draft() {
  const pending = new Map([
    ["blob:question", { file: file("question.png") }],
    ["blob:answer", { file: file("answer.png") }],
  ]);
  return {
    pending,
    question: attachImage(
      "Identify this?",
      null,
      "blob:question",
      "Question figure",
    ),
    answer: attachImage(
      "An explanation.",
      null,
      "blob:answer",
      "Answer figure",
    ),
  };
}
test("selecting/validating a local image does not upload or mutate the document", () => {
  const d = draft();
  validateImageFile(d.pending.get("blob:question").file);
  const validated = documentForValidation(d.question, d.pending);
  assert.deepEqual(imageSources(d.question), ["blob:question"]);
  assert.equal(d.pending.get("blob:question").uploadedUrl, undefined);
  assert.notEqual(imageSources(validated)[0], "blob:question");
  assert.equal(
    actionSchema.safeParse({
      type: "createCard",
      deckId: "deck",
      question: "Identify this?",
      answer: "Answer",
      questionRich: d.question,
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      type: "createCard",
      deckId: "deck",
      question: "Identify this?",
      answer: "Answer",
      questionRich: validated,
    }).success,
    true,
  );
});
test("Save resolves both sides, persistence retains image URLs, and practice renders them at the right time", async () => {
  const d = draft();
  const uploads = [];
  const upload = async (f) => {
    uploads.push(f.name);
    return f.name === "question.png" ? questionUrl : answerUrl;
  };
  assert.equal(uploads.length, 0);
  const q = await resolveImageDocument(d.question, d.pending, upload);
  const a = await resolveImageDocument(d.answer, d.pending, upload);
  assert.deepEqual(uploads, ["question.png", "answer.png"]);
  const action = actionSchema.parse({
    type: "createCard",
    deckId: "foundations",
    question: richText(q),
    answer: richText(a),
    questionRich: q,
    answerRich: a,
  });
  const workspace = workspaceSchema.parse(
    JSON.parse(JSON.stringify(applyPreview(createPreview(), action))),
  );
  const saved = workspace.cards.at(-1);
  const queued = studyQueue(workspace).find((c) => c.id === saved.id);
  const hidden = renderToStaticMarkup(
    React.createElement(ReviewCard, { card: queued, revealed: false }),
  );
  assert.ok(hidden.includes(questionUrl));
  assert.ok(!hidden.includes(answerUrl));
  assert.match(hidden, /loading="eager"/);
  const revealed = renderToStaticMarkup(
    React.createElement(ReviewCard, { card: queued, revealed: true }),
  );
  assert.ok(revealed.includes(questionUrl));
  assert.ok(revealed.includes(answerUrl));
  const edited = applyPreview(
    workspace,
    actionSchema.parse({
      type: "updateCard",
      id: saved.id,
      version: saved.version,
      question: "Identify this updated figure?",
      answer: "Updated explanation.",
      questionRich: attachImage(
        "Identify this updated figure?",
        null,
        answerUrl,
        "Replacement",
      ),
      answerRich: attachImage(
        "Updated explanation.",
        null,
        answerUrl,
        "Answer",
      ),
    }),
  );
  const updated = edited.cards.find((c) => c.id === saved.id);
  assert.ok(
    renderToStaticMarkup(
      React.createElement(ReviewCard, { card: updated, revealed: true }),
    ).includes(answerUrl),
  );
  assert.ok(
    !renderToStaticMarkup(
      React.createElement(ReviewCard, { card: updated, revealed: false }),
    ).includes(questionUrl),
  );
});
test("failed uploads preserve local drafts; successful uploads are reused on retry", async () => {
  const d = draft();
  const attempts = [];
  let fail = true;
  const upload = async (f) => {
    attempts.push(f.name);
    if (f.name === "answer.png" && fail) throw new Error("Offline");
    return f.name === "question.png" ? questionUrl : answerUrl;
  };
  await resolveImageDocument(d.question, d.pending, upload);
  await assert.rejects(
    resolveImageDocument(d.answer, d.pending, upload),
    /Offline/,
  );
  assert.deepEqual(imageSources(d.answer), ["blob:answer"]);
  fail = false;
  await resolveImageDocument(d.question, d.pending, upload);
  await resolveImageDocument(d.answer, d.pending, upload);
  assert.deepEqual(attempts, ["question.png", "answer.png", "answer.png"]);
});
test("removed and replaced local selections are not uploaded; unknown blobs cannot be saved", async () => {
  const d = draft();
  let uploads = 0;
  const upload = async () => {
    uploads++;
    return questionUrl;
  };
  await resolveImageDocument(
    plainDocument("No picture now"),
    d.pending,
    upload,
  );
  assert.equal(uploads, 0);
  await resolveImageSource("blob:answer", d.pending, upload);
  assert.equal(uploads, 1);
  assert.equal(d.pending.get("blob:question").uploadedUrl, undefined);
  assert.throws(() =>
    documentForValidation(
      attachImage("Q", null, "blob:foreign", "Unknown"),
      d.pending,
    ),
  );
  await assert.rejects(resolveImageSource("blob:foreign", d.pending, upload));
  assert.equal(uploads, 1);
});
test("cover saves reuse uploaded assets and retain the selected deck icon in rendered tiles", async () => {
  const pending = new Map([["blob:cover", { file: file() }]]);
  let uploads = 0;
  const upload = async () => {
    uploads++;
    return questionUrl;
  };
  const url = await resolveImageSource("blob:cover", pending, upload);
  await resolveImageSource("blob:cover", pending, upload);
  assert.equal(uploads, 1);
  const workspace = createPreview();
  const deck = { ...workspace.decks[0], imageUrl: url, icon: "brain" };
  const html = renderToStaticMarkup(
    React.createElement(DeckTile, { deck, workspace, open: () => {} }),
  );
  assert.ok(html.includes(questionUrl));
  assert.match(html, /deck-cover-icon/);
  assert.match(html, /lucide-brain/);
});
test("empty, oversized, and nonimage selections are rejected before Save", () => {
  for (const input of [
    { type: "text/plain", size: 50 },
    { type: "image/png", size: 0 },
    { type: "image/jpeg", size: 6 * 1024 * 1024 },
  ])
    assert.throws(() => validateImageFile(input));
});
