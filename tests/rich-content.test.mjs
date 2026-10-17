import assert from "node:assert/strict";
import { test } from "node:test";
import { actionSchema, workspaceSchema } from "../src/lib/validation.ts";
import {
  richDocumentSchema,
  plainDocument,
  richText,
  cloudinaryImageUrl,
  attachImage,
  editPlainDocument,
} from "../src/lib/rich-content.ts";
import { createPreview, applyPreview } from "../src/lib/preview.ts";
import { getPageCopy } from "../src/lib/page-copy.ts";
const questionRich = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "A question?", marks: [{ type: "bold" }] },
      ],
    },
  ],
};
const image = {
  type: "image",
  attrs: {
    src: "https://res.cloudinary.com/demo/image/upload/example.jpg",
    alt: "An explanation",
  },
};
test("formatted questions and image-only answers are valid and retain structure", () => {
  const result = actionSchema.safeParse({
    type: "createCard",
    deckId: "deck",
    question: "A question?",
    answer: "",
    questionRich,
    answerRich: { type: "doc", content: [image] },
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data.questionRich, questionRich);
});
test("plain and formatted text cannot disagree", () => {
  assert.equal(
    actionSchema.safeParse({
      type: "createCard",
      deckId: "deck",
      question: "Different?",
      answer: "Answer",
      questionRich,
    }).success,
    false,
  );
});
test("question text must match the document; empty images and unsafe links are rejected", () => {
  assert.equal(
    actionSchema.safeParse({
      type: "createCard",
      deckId: "deck",
      question: "A question?",
      answer: "Answer",
      questionRich: { type: "doc", content: [image] },
    }).success,
    false,
  );
  assert.equal(
    richDocumentSchema.safeParse({ type: "doc", content: [{ type: "image" }] })
      .success,
    false,
  );
  assert.equal(
    richDocumentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Bad",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    }).success,
    false,
  );
});
test("HTML, unknown node types, non-Cloudinary sources and credentials in URLs are rejected", () => {
  for (const type of ["script", "iframe", "html"])
    assert.equal(
      richDocumentSchema.safeParse({ type: "doc", content: [{ type }] })
        .success,
      false,
    );
  for (const url of [
    "https://example.com/a.jpg",
    "data:image/png;base64,a",
    "http://res.cloudinary.com/demo/image/upload/a.jpg",
    "https://user:password@res.cloudinary.com/demo/image/upload/a.jpg",
  ])
    assert.equal(cloudinaryImageUrl.safeParse(url).success, false);
});
test("deeply nested documents fail before recursive parsing", () => {
  let node = { type: "text", text: "deep" };
  for (let i = 0; i < 30; i++) node = { type: "paragraph", content: [node] };
  assert.equal(
    richDocumentSchema.safeParse({ type: "doc", content: [node] }).success,
    false,
  );
});
test("plain-text compatibility preserves multiline content", () => {
  const text = "First line\nSecond line\n\nLast line";
  assert.equal(richText(plainDocument(text)), text);
});
test("old preview storage defaults to simple mode without losing cards", () => {
  const old = createPreview();
  delete old.preferences.editorMode;
  const parsed = workspaceSchema.parse(old);
  assert.equal(parsed.preferences.editorMode, "simple");
  assert.equal(parsed.cards.length, old.cards.length);
});
test("rich preference and deck identity round-trip through preview persistence", () => {
  const old = createPreview();
  const next = applyPreview(old, {
    type: "preferences",
    timezone: "UTC",
    newCardLimit: 10,
    editorMode: "rich",
  });
  const deck = next.decks[0];
  const changed = applyPreview(next, {
    type: "updateDeck",
    id: deck.id,
    name: deck.name,
    icon: "brain",
    imageUrl: image.attrs.src,
  });
  const restored = workspaceSchema.parse(JSON.parse(JSON.stringify(changed)));
  assert.equal(restored.preferences.editorMode, "rich");
  assert.equal(restored.decks[0].icon, "brain");
  assert.equal(restored.decks[0].imageUrl, image.attrs.src);
});
test("formatted edits preserve scheduling while incrementing the card version", () => {
  const old = createPreview();
  const card = old.cards[0];
  const next = applyPreview(old, {
    type: "updateCard",
    id: card.id,
    version: card.version,
    question: "A question?",
    questionRich,
    answer: "Answer",
    answerRich: plainDocument("Answer"),
  });
  assert.deepEqual(next.cards[0].questionRich, questionRich);
  assert.deepEqual(next.cards[0].schedule, card.schedule);
  assert.equal(next.cards[0].version, 1);
});
test("the copy library changes all page titles between adjacent refreshes", () => {
  for (let i = 0; i < 6; i++) {
    const a = getPageCopy(i),
      b = getPageCopy(i + 1);
    for (const page of ["today", "decks", "settings"])
      assert.notEqual(a[page][0], b[page][0]);
    assert.notEqual(a.complete, b.complete);
  }
});

test("question and answer uploads retain images across Focus edits and preview reloads", () => {
  const src = image.attrs.src;
  const questionDoc = attachImage(
    "Name this shape?",
    null,
    src,
    "Question illustration",
  );
  const answerDoc = attachImage("A circle.", null, src, "Answer illustration");
  const action = actionSchema.parse({
    type: "createCard",
    deckId: "foundations",
    question: "Name this shape?",
    answer: "A circle.",
    questionRich: questionDoc,
    answerRich: answerDoc,
  });
  const next = applyPreview(createPreview(), action);
  const saved = workspaceSchema
    .parse(JSON.parse(JSON.stringify(next)))
    .cards.at(-1);
  assert.equal(saved.questionRich.content[1].attrs.src, src);
  const changed = editPlainDocument("Identify the shape?", saved.questionRich);
  assert.equal(richText(changed), "Identify the shape?\n");
  assert.equal(changed.content[1].attrs.src, src);
  assert.equal(editPlainDocument("Name this shape?", questionDoc), questionDoc);
  assert.equal(questionDoc.content.length, 2);
  assert.equal(
    attachImage("Name this shape?", questionDoc, src, "Another image").content
      .length,
    3,
  );
  assert.equal(questionDoc.content.length, 2);
});
