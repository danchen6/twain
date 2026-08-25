import assert from "node:assert/strict";
import test from "node:test";

import { PUZZLE_VERSION } from "../src/generator.js";
import { analyzePuzzleDifficulty } from "../src/solver.js";

function clue(value, row, col, solutionIndex) {
  return { value, row, col, solutionIndex };
}

function singleLinePuzzle() {
  return {
    version: PUZZLE_VERSION,
    difficulty: "easy",
    seed: "solver-single-line",
    rows: 2,
    cols: 2,
    lines: [
      {
        id: "a",
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 1, col: 0 },
        ],
        clues: [clue(1, 0, 0, 0), clue(2, 1, 0, 3)],
      },
    ],
    walls: [],
  };
}

function multipleSolutionPuzzle() {
  return {
    version: PUZZLE_VERSION,
    difficulty: "easy",
    seed: "solver-multiple",
    rows: 3,
    cols: 3,
    lines: [
      {
        id: "a",
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 1, col: 2 },
          { row: 1, col: 1 },
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
        ],
        clues: [clue(1, 0, 0, 0), clue(2, 2, 2, 8)],
      },
    ],
    walls: [],
  };
}

function twainPuzzle() {
  return {
    version: PUZZLE_VERSION,
    difficulty: "easy",
    seed: "solver-twain",
    rows: 2,
    cols: 2,
    lines: [
      {
        id: "a",
        solution: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
        clues: [clue(1, 0, 0, 0), clue(2, 0, 1, 1)],
      },
      {
        id: "b",
        solution: [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
        ],
        clues: [clue(1, 1, 0, 0), clue(2, 1, 1, 1)],
      },
    ],
    walls: [
      {
        a: { row: 0, col: 1 },
        b: { row: 1, col: 1 },
      },
    ],
  };
}

function stableMetrics(analysis) {
  const { milliseconds, ...stable } = analysis;
  return stable;
}

test("bounded analysis solves forced single-line and Twain boards", () => {
  const singleLine = analyzePuzzleDifficulty(singleLinePuzzle());
  const twain = analyzePuzzleDifficulty(twainPuzzle());

  assert.equal(singleLine.solved, true);
  assert.equal(singleLine.solutionsFound, 1);
  assert.equal(singleLine.exhausted, true);
  assert.equal(singleLine.firstSolutionDecisions, 0);
  assert.equal(singleLine.firstSolutionForcedMoves, 3);

  assert.equal(twain.solved, true);
  assert.equal(twain.solutionsFound, 1);
  assert.equal(twain.exhausted, true);
  assert.equal(twain.firstSolutionDecisions, 0);
  assert.equal(twain.firstSolutionForcedMoves, 2);
});

test("solution density recognizes multiple valid paths", () => {
  const analysis = analyzePuzzleDifficulty(multipleSolutionPuzzle(), {
    nodeLimit: 1_000,
    solutionLimit: 8,
  });

  assert.equal(analysis.solved, true);
  assert.equal(analysis.solutionsFound, 2);
  assert.equal(analysis.exhausted, true);
  assert.ok(analysis.firstSolutionDecisions > 0);
  assert.equal(
    analysis.score,
    Math.round(
      (analysis.firstSolutionNodes +
        analysis.firstSolutionDecisions * 2 +
        analysis.firstSolutionBacktracks * 3) /
        Math.sqrt(analysis.solutionsFound),
    ),
  );
});

test("difficulty analysis is independent of the constructive witness", () => {
  const puzzle = multipleSolutionPuzzle();
  const withoutWitness = structuredClone(puzzle);
  withoutWitness.lines[0].solution = [];

  assert.deepEqual(
    stableMetrics(analyzePuzzleDifficulty(withoutWitness)),
    stableMetrics(analyzePuzzleDifficulty(puzzle)),
  );
});

test("difficulty analysis obeys deterministic search bounds", () => {
  const limited = analyzePuzzleDifficulty(multipleSolutionPuzzle(), {
    nodeLimit: 1,
    solutionLimit: 2,
  });

  assert.equal(limited.nodes, 1);
  assert.equal(limited.limitReached, true);
  assert.equal(limited.solved, false);
  assert.throws(
    () => analyzePuzzleDifficulty(singleLinePuzzle(), { nodeLimit: 0 }),
    RangeError,
  );
  assert.throws(
    () => analyzePuzzleDifficulty(singleLinePuzzle(), { solutionLimit: 0 }),
    RangeError,
  );
});
