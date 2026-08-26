import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDailyResultShareText,
  formatHintCount,
} from "../src/share.js";

test("result share copy includes polished zero, singular, and plural hint counts", () => {
  assert.equal(formatHintCount(0), "0 hints");
  assert.equal(formatHintCount(1), "1 hint");
  assert.equal(formatHintCount(2), "2 hints");

  assert.equal(
    formatDailyResultShareText({
      elapsed: "01:23",
      hints: 0,
      twainNumber: 1,
    }),
    "I completed today's Twain #1 in 01:23 with no hints. Can you beat my time?",
  );
  assert.equal(
    formatDailyResultShareText({
      elapsed: "01:23",
      hints: 1,
      twainNumber: 1,
    }),
    "I completed today's Twain #1 in 01:23 with 1 hint. Can you beat my time?",
  );
  assert.equal(
    formatDailyResultShareText({
      elapsed: "01:23",
      hints: 2,
      twainNumber: 1,
    }),
    "I completed today's Twain #1 in 01:23 with 2 hints. Can you beat my time?",
  );
});

test("result share copy keeps the pre-launch identity fallback", () => {
  assert.equal(
    formatDailyResultShareText({ elapsed: "01:23", hints: 0 }),
    "I completed today's Twain in 01:23 with no hints. Can you beat my time?",
  );
});

test("hint copy rejects invalid counters", () => {
  assert.throws(() => formatHintCount(-1), RangeError);
  assert.throws(() => formatHintCount(1.5), RangeError);
});
