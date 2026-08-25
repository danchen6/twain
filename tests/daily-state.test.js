import assert from "node:assert/strict";
import test from "node:test";

import {
  dailyDifficultyAt,
  dailySchedule,
  dailyStageSeed,
} from "../src/daily.js";
import {
  createDailyPlay,
  createDailyStorageRecord,
  restoreDailyPlay,
  storedDailyStageIndex,
} from "../src/daily-state.js";
import { applyMove, snapshotPlayState } from "../src/game.js";
import { generatePuzzle } from "../src/generator.js";

const dateKey = "2026-08-29";

function dailyPuzzle(stageIndex = 0, puzzleDateKey = dateKey) {
  const difficulty = dailyDifficultyAt(puzzleDateKey, stageIndex);
  return generatePuzzle(difficulty, {
    seed: dailyStageSeed(puzzleDateKey, difficulty),
  });
}

test("daily play records round-trip paths, history, timer, and counters", () => {
  const puzzle = dailyPuzzle();
  const play = createDailyPlay(dateKey, puzzle);
  assert.deepEqual(play.schedule, dailySchedule(dateKey));
  play.history.push(snapshotPlayState(play.paths, play.activeLineId));
  play.paths = applyMove(
    puzzle,
    play.paths,
    "a",
    puzzle.lines[0].solution[0],
  ).paths;
  play.elapsedMs = 12_345;
  play.hints = 2;
  play.mistakes = 3;

  const stored = createDailyStorageRecord(play);
  const restored = restoreDailyPlay(stored, dateKey, puzzle);

  assert.equal(storedDailyStageIndex(stored, dateKey), 0);
  assert.deepEqual(restored.paths, play.paths);
  assert.deepEqual(restored.history, play.history);
  assert.equal(restored.elapsedMs, 12_345);
  assert.equal(restored.hints, 2);
  assert.equal(restored.mistakes, 3);
  assert.equal(restored.stageCompleted, false);
  assert.equal(restored.dailyComplete, false);
});

test("a solved final-stage record restores as a completed daily run", () => {
  const shortDateKey = "2026-08-25";
  const finalStageIndex = dailySchedule(shortDateKey).length - 1;
  const puzzle = dailyPuzzle(finalStageIndex, shortDateKey);
  const play = createDailyPlay(shortDateKey, puzzle, finalStageIndex);

  for (const line of puzzle.lines) {
    for (const cell of line.solution) {
      play.paths = applyMove(puzzle, play.paths, line.id, cell).paths;
    }
  }

  const restored = restoreDailyPlay(
    createDailyStorageRecord(play, 98_765),
    shortDateKey,
    puzzle,
  );

  assert.equal(restored.stageCompleted, true);
  assert.equal(restored.dailyComplete, true);
  assert.equal(restored.elapsedMs, 98_765);
  assert.equal(restored.stageIndex, finalStageIndex);
});

test("stale, malformed, and illegal daily records are rejected", () => {
  const puzzle = dailyPuzzle();
  const play = createDailyPlay(dateKey, puzzle);
  const stored = createDailyStorageRecord(play);

  assert.equal(storedDailyStageIndex(stored, "2026-08-26"), null);
  assert.equal(
    storedDailyStageIndex({ ...stored, version: stored.version - 1 }, dateKey),
    null,
  );
  assert.equal(
    restoreDailyPlay({ ...stored, elapsedMs: -1 }, dateKey, puzzle),
    null,
  );
  assert.equal(
    restoreDailyPlay(
      { ...stored, paths: { a: [{ row: 999, col: 999 }], b: [] } },
      dateKey,
      puzzle,
    ),
    null,
  );
  assert.throws(
    () => createDailyPlay(dateKey, { ...puzzle, seed: "not-daily" }),
    RangeError,
  );
  assert.throws(() => createDailyStorageRecord(play, -1), RangeError);
});
