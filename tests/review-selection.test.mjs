import assert from "node:assert/strict";
import { test } from "node:test";
import {
  reviewCandidates,
  selectedReviewCards,
} from "../src/lib/review-selection.ts";
import { createPreview, applyPreview } from "../src/lib/preview.ts";
import { nextSchedule } from "../src/lib/study.ts";
const now = new Date();
function fixture() {
  const w = createPreview();
  w.preferences.newCardLimit = 0;
  w.cards[0].schedule = {
    ...nextSchedule(w.cards[0].schedule, 3, now),
    due: new Date(now.getTime() + 86400000).toISOString(),
  };
  w.cards[1].schedule = {
    ...w.cards[0].schedule,
    due: new Date(now.getTime() - 86400000).toISOString(),
    lapses: 1,
  };
  return w;
}
test("free practice includes future and new cards while scheduled respects eligibility", () => {
  const w = fixture();
  assert.equal(
    reviewCandidates(w, { mode: "practice" }, now).length,
    w.cards.length,
  );
  assert.deepEqual(
    reviewCandidates(w, { mode: "scheduled" }, now).map((c) => c.id),
    [w.cards[1].id],
  );
  assert.equal(
    reviewCandidates(w, { mode: "practice", filter: "difficult" }, now)[0].id,
    w.cards[1].id,
  );
  assert.equal(
    reviewCandidates(w, { mode: "practice", filter: "due" }, now).length,
    1,
  );
  assert.equal(
    reviewCandidates(w, { mode: "practice", filter: "new" }, now).length,
    w.cards.length - 2,
  );
  assert.equal(
    reviewCandidates(w, { mode: "practice", deckId: "missing" }, now).length,
    0,
  );
  assert.equal(
    reviewCandidates(w, { mode: "practice", query: "active recall" }, now)[0]
      .id,
    w.cards[0].id,
  );
});
test("selection excludes unknown cards, supports shuffle and caps the session", () => {
  const w = fixture();
  const ids = w.cards.map((c) => c.id);
  assert.deepEqual(
    selectedReviewCards(
      w,
      { mode: "scheduled", ids: [...ids, "foreign"] },
      now,
    ).map((c) => c.id),
    [ids[1]],
  );
  const result = selectedReviewCards(
    w,
    { mode: "practice", ids, shuffle: true, limit: 2 },
    now,
    () => 0,
  );
  assert.equal(result.length, 2);
  assert.notEqual(result[0].id, ids[0]);
  assert.deepEqual(
    w.cards.map((c) => c.id),
    ids,
  );
});
test("practice preserves scheduling, card version and daily new allowance; retry is idempotent", () => {
  const w = fixture();
  const action = {
    type: "review",
    id: w.cards[0].id,
    version: 0,
    rating: 3,
    mode: "practice",
    operationId: crypto.randomUUID(),
  };
  const next = applyPreview(w, action);
  assert.deepEqual(next.cards, w.cards);
  assert.equal(next.reviews[0].mode, "practice");
  assert.equal(next.reviews[0].wasNew, false);
  assert.deepEqual(applyPreview(next, action), next);
  assert.throws(
    () => applyPreview(next, { ...action, mode: "scheduled" }),
    /already been used/,
  );
  assert.throws(() => applyPreview(w, { ...action, version: 99 }), /changed/);
  assert.throws(() => applyPreview(w, { ...action, id: "foreign" }), /changed/);
  assert.throws(
    () => applyPreview(w, { ...action, mode: "scheduled" }),
    /not ready/,
  );
});
