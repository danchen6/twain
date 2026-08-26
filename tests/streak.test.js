import assert from "node:assert/strict";
import test from "node:test";

import {
  STREAK_STORAGE_VERSION,
  activeStreakForDate,
  createStreakRecord,
  recordDailyCompletion,
  restoreStreakRecord,
} from "../src/streak.js";

test("daily completion grows current, longest, and total streak counters", () => {
  const first = recordDailyCompletion(createStreakRecord(), "2026-08-26");
  const second = recordDailyCompletion(first, "2026-08-27");

  assert.deepEqual(first, {
    version: STREAK_STORAGE_VERSION,
    currentStreak: 1,
    longestStreak: 1,
    totalCompletedDays: 1,
    lastCompletedDate: "2026-08-26",
  });
  assert.deepEqual(second, {
    version: STREAK_STORAGE_VERSION,
    currentStreak: 2,
    longestStreak: 2,
    totalCompletedDays: 2,
    lastCompletedDate: "2026-08-27",
  });
  assert.equal(activeStreakForDate(second, "2026-08-28"), 2);
});

test("same-day completion is idempotent and a missed day resets only current streak", () => {
  const twoDays = recordDailyCompletion(
    recordDailyCompletion(createStreakRecord(), "2026-08-26"),
    "2026-08-27",
  );

  assert.deepEqual(recordDailyCompletion(twoDays, "2026-08-27"), twoDays);

  const afterGap = recordDailyCompletion(twoDays, "2026-08-29");
  assert.equal(afterGap.currentStreak, 1);
  assert.equal(afterGap.longestStreak, 2);
  assert.equal(afterGap.totalCompletedDays, 3);
  assert.equal(activeStreakForDate(afterGap, "2026-08-31"), 0);
});

test("pre-launch, backward-clock, and malformed records cannot inflate streaks", () => {
  const empty = createStreakRecord();
  assert.deepEqual(recordDailyCompletion(empty, "2026-08-25"), empty);

  const completed = recordDailyCompletion(empty, "2026-08-27");
  assert.deepEqual(recordDailyCompletion(completed, "2026-08-26"), completed);
  assert.equal(
    restoreStreakRecord({ ...completed, totalCompletedDays: 0 }),
    null,
  );
  assert.equal(
    restoreStreakRecord({ ...completed, lastCompletedDate: "not-a-date" }),
    null,
  );
  assert.throws(() => recordDailyCompletion(empty, "2026-02-30"), RangeError);
});
