import assert from "node:assert/strict";
import { test } from "node:test";
import {
  newSchedule,
  nextSchedule,
  localDay,
  studyQueue,
  todayReviews,
} from "../src/lib/study.ts";
import { actionSchema } from "../src/lib/validation.ts";

const now = new Date("2026-10-17T18:30:00.000Z");
const card = (id, schedule = newSchedule(now)) => ({
  id,
  deckId: "deck",
  question: "Question?",
  answer: "Answer",
  schedule,
  version: 0,
  createdAt: now.toISOString(),
});
const workspace = (
  cards,
  reviews = [],
  newCardLimit = 2,
  timezone = "Asia/Dhaka",
) => ({ cards, reviews, decks: [], preferences: { timezone, newCardLimit } });

test("local day follows the configured timezone across midnight", () => {
  assert.equal(localDay(now, "UTC"), "2026-10-17");
  assert.equal(localDay(now, "Asia/Dhaka"), "2026-10-18");
});
test("local day handles daylight-saving transitions", () => {
  assert.equal(
    localDay("2026-11-01T05:30:00Z", "America/New_York"),
    "2026-11-01",
  );
  assert.equal(
    localDay("2026-11-01T06:30:00Z", "America/New_York"),
    "2026-11-01",
  );
});
test("due cards precede new cards and future reviews stay hidden", () => {
  const reviewed = nextSchedule(newSchedule(now), 3, now);
  const due = card("due", { ...reviewed, due: "2026-10-16T00:00:00Z" });
  const future = card("future", { ...reviewed, due: "2026-10-19T00:00:00Z" });
  const queue = studyQueue(
    workspace([card("new"), future, due]),
    undefined,
    now,
  );
  assert.deepEqual(
    queue.map((c) => c.id),
    ["due", "new"],
  );
});
test("the daily new limit applies across decks and counts introductions, not repeats", () => {
  const reviews = [
    { wasNew: true, reviewedAt: now.toISOString() },
    { wasNew: false, reviewedAt: now.toISOString() },
  ];
  const w = workspace(
    [card("one"), { ...card("two"), deckId: "other" }],
    reviews,
  );
  assert.equal(studyQueue(w, undefined, now).length, 1);
  assert.equal(studyQueue(w, "other", now).length, 1);
});
test("yesterday's introductions do not consume today's allowance", () => {
  const w = workspace(
    [card("new")],
    [{ wasNew: true, reviewedAt: "2026-10-17T12:00:00Z" }],
    1,
  );
  assert.equal(todayReviews(w, now).length, 0);
  assert.equal(studyQueue(w, undefined, now).length, 1);
});
test("a zero new-card limit still allows due reviews", () => {
  const review = card("due", {
    ...nextSchedule(newSchedule(now), 3, now),
    due: now.toISOString(),
  });
  assert.deepEqual(
    studyQueue(workspace([card("new"), review], [], 0), undefined, now).map(
      (c) => c.id,
    ),
    ["due"],
  );
});
test("all four FSRS grades produce serializable future schedules without mutating the input", () => {
  const original = newSchedule(now);
  for (const rating of [1, 2, 3, 4]) {
    const result = nextSchedule(original, rating, now);
    assert.equal(result.reps, 1);
    assert.ok(new Date(result.due) > now);
    assert.equal(result.last_review, now.toISOString());
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  }
  assert.equal(original.reps, 0);
});
test("invalid recall grades are rejected", () => {
  for (const rating of [0, 5, 1.5, NaN])
    assert.throws(() => nextSchedule(newSchedule(now), rating, now));
});
test("blank cards, invalid timezones and excessive daily limits are rejected", () => {
  assert.equal(
    actionSchema.safeParse({
      type: "createCard",
      deckId: "a",
      question: "  ",
      answer: "text",
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      type: "preferences",
      timezone: "Mars/Olympus",
      newCardLimit: 20,
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      type: "preferences",
      timezone: "UTC",
      newCardLimit: 201,
    }).success,
    false,
  );
});
test("review submissions require an idempotency key, version and a valid grade", () => {
  const valid = {
    type: "review",
    id: "card",
    version: 0,
    rating: 3,
    operationId: "fc3b1c40-8762-4d27-ab85-9318453dcb32",
  };
  assert.equal(actionSchema.safeParse(valid).success, true);
  for (const change of [{ operationId: "" }, { version: -1 }, { rating: 0 }])
    assert.equal(
      actionSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});

const { applyPreview, createPreview } = await import("../src/lib/preview.ts");
test("preview ratings are idempotent even after the card version changes", () => {
  const w = createPreview();
  const first = w.cards[0];
  const action = {
    type: "review",
    id: first.id,
    version: first.version,
    rating: 3,
    operationId: crypto.randomUUID(),
  };
  const once = applyPreview(w, action);
  const twice = applyPreview(once, action);
  assert.deepEqual(twice, once);
  assert.equal(twice.reviews.length, 1);
  assert.equal(w.reviews.length, 0);
});
test("a review operation cannot be reused for a different rating", () => {
  const w = createPreview();
  const action = {
    type: "review",
    id: w.cards[0].id,
    version: 0,
    rating: 3,
    operationId: crypto.randomUUID(),
  };
  const next = applyPreview(w, action);
  assert.throws(
    () => applyPreview(next, { ...action, rating: 4 }),
    /already been used/,
  );
});
test("editing a card invalidates a stale session but preserves its schedule", () => {
  const w = createPreview();
  const first = w.cards[0];
  const edited = applyPreview(w, {
    type: "updateCard",
    id: first.id,
    version: 0,
    question: "A better question?",
    answer: "A focused answer.",
  });
  assert.deepEqual(edited.cards[0].schedule, first.schedule);
  assert.throws(
    () =>
      applyPreview(edited, {
        type: "review",
        id: first.id,
        version: 0,
        rating: 3,
        operationId: crypto.randomUUID(),
      }),
    /changed/,
  );
});
test("removing a deck preserves introduction history and its daily limit usage", () => {
  const w = createPreview();
  const first = w.cards[0];
  const reviewed = applyPreview(w, {
    type: "review",
    id: first.id,
    version: 0,
    rating: 3,
    operationId: crypto.randomUUID(),
  });
  const removed = applyPreview(reviewed, {
    type: "deleteDeck",
    id: first.deckId,
  });
  assert.equal(
    removed.cards.some((c) => c.deckId === first.deckId),
    false,
  );
  assert.equal(removed.reviews[0].cardId, null);
  assert.equal(removed.reviews[0].wasNew, true);
});
