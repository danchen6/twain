import assert from "node:assert/strict";
import test from "node:test";

import {
  DAILY_RUN_VERSION,
  DAILY_STORAGE_KEY,
  DIFFICULTY_CATALOG,
  FIRST_TWAIN_DATE_KEY,
  MAX_DAILY_STAGES,
  MIN_DAILY_STAGES,
  dailyDifficultyAt,
  dailySchedule,
  dailyStageSeed,
  dailyTwainNumber,
  millisecondsUntilNextTaiwanDay,
  taiwanDateKey,
} from "../src/daily.js";

test("Taiwan daily dates roll over at 16:00 UTC", () => {
  assert.equal(
    taiwanDateKey(new Date("2026-08-25T15:59:59.999Z")),
    "2026-08-25",
  );
  assert.equal(
    taiwanDateKey(new Date("2026-08-25T16:00:00.000Z")),
    "2026-08-26",
  );
  assert.equal(
    millisecondsUntilNextTaiwanDay(
      new Date("2026-08-25T15:59:59.999Z"),
    ),
    1,
  );
  assert.equal(
    millisecondsUntilNextTaiwanDay(
      new Date("2026-08-25T16:00:00.000Z"),
    ),
    24 * 60 * 60 * 1000,
  );
});

test("daily Twain numbers begin at one on 2026-08-26 and advance by calendar day", () => {
  assert.equal(FIRST_TWAIN_DATE_KEY, "2026-08-26");
  assert.equal(dailyTwainNumber("2026-08-25"), null);
  assert.equal(dailyTwainNumber("2026-08-26"), 1);
  assert.equal(dailyTwainNumber("2026-08-27"), 2);
  assert.equal(dailyTwainNumber("2026-08-31"), 6);
  assert.equal(dailyTwainNumber("2026-09-01"), 7);
  assert.equal(
    dailyTwainNumber("2028-02-29"),
    dailyTwainNumber("2028-02-28") + 1,
  );
});

test("daily schedules deterministically sample and shuffle three to five levels", () => {
  const dates = Array.from(
    { length: 31 },
    (_, index) => `2026-08-${String(index + 1).padStart(2, "0")}`,
  );
  const schedules = dates.map((dateKey) => dailySchedule(dateKey));

  for (const [index, schedule] of schedules.entries()) {
    assert.deepEqual(schedule, dailySchedule(dates[index]));
    assert.ok(schedule.length >= MIN_DAILY_STAGES);
    assert.ok(schedule.length <= MAX_DAILY_STAGES);
    assert.equal(new Set(schedule).size, schedule.length);
    assert.ok(schedule.every((difficulty) => DIFFICULTY_CATALOG.includes(difficulty)));
    assert.ok(Object.isFrozen(schedule));
  }

  assert.deepEqual(
    [...new Set(schedules.map(({ length }) => length))].sort(),
    [3, 4, 5],
  );
  assert.deepEqual(dailySchedule("2026-08-29"), [
    "easy",
    "ultra",
    "hard",
    "medium",
    "extra",
  ]);
  assert.equal(dailyDifficultyAt("2026-08-29", 1), "ultra");
  assert.equal(DAILY_STORAGE_KEY, `twain:daily:v${DAILY_RUN_VERSION}`);
});

test("daily stage seeds are deterministic and namespaced by date and stage", () => {
  const seeds = DIFFICULTY_CATALOG.map((difficulty) =>
    dailyStageSeed("2026-08-25", difficulty),
  );

  assert.equal(
    seeds[0],
    `twain-daily:v${DAILY_RUN_VERSION}:2026-08-25:easy`,
  );
  assert.equal(new Set(seeds).size, DIFFICULTY_CATALOG.length);
  assert.equal(dailyStageSeed("2026-08-25", "ultra"), seeds.at(-1));
  assert.notEqual(
    dailyStageSeed("2026-08-26", "ultra"),
    dailyStageSeed("2026-08-25", "ultra"),
  );
});

test("daily helpers reject malformed dates, stages, and clocks", () => {
  assert.throws(() => taiwanDateKey(Number.NaN), TypeError);
  assert.throws(() => millisecondsUntilNextTaiwanDay(Number.NaN), TypeError);
  assert.throws(() => dailyStageSeed("2026-02-30", "easy"), RangeError);
  assert.throws(() => dailyTwainNumber("2026-02-30"), RangeError);
  assert.throws(() => dailyStageSeed("2026-08-25", "impossible"), RangeError);
  assert.throws(() => dailySchedule("2026-02-30"), RangeError);
  assert.throws(() => dailyDifficultyAt("2026-08-25", -1), RangeError);
  assert.throws(() => dailyDifficultyAt("2026-08-25", 3), RangeError);
});
