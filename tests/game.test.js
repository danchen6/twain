import assert from "node:assert/strict";
import test from "node:test";

import {
  PUZZLE_VERSION,
  manhattanDistance,
  validatePuzzle,
} from "../src/generator.js";
import {
  adjacentCell,
  applyMove,
  clearPaths,
  clueDisplayValue,
  createEmptyPaths,
  hintPaths,
  isSolved,
  lineDisplayName,
  lineIdAtTarget,
  nextExpectedClue,
  rewindToPathCell,
  snapshotPlayState,
  undoPlayState,
} from "../src/game.js";

test("Twain presents independent numeric and alphabetic clue systems", () => {
  assert.equal(lineDisplayName("a"), "Number line");
  assert.equal(lineDisplayName("b"), "Letter line");
  assert.equal(clueDisplayValue("a", 3), "3");
  assert.equal(clueDisplayValue("b", 1), "A");
  assert.equal(clueDisplayValue("b", 26), "Z");
  assert.equal(clueDisplayValue("b", 27), "AA");
});

function clue(value, cell, solutionIndex) {
  return { value, ...cell, solutionIndex };
}

function createTwainFixture() {
  const firstSolution = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 1, col: 3 },
    { row: 1, col: 2 },
  ];
  const secondSolution = [
    { row: 2, col: 3 },
    { row: 2, col: 2 },
    { row: 2, col: 1 },
    { row: 2, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];

  return {
    version: PUZZLE_VERSION,
    difficulty: "easy",
    seed: "twain-fixture",
    rows: 3,
    cols: 4,
    lines: [
      {
        id: "a",
        solution: firstSolution,
        clues: [
          clue(1, firstSolution[0], 0),
          clue(2, firstSolution[3], 3),
          clue(3, firstSolution[5], 5),
        ],
      },
      {
        id: "b",
        solution: secondSolution,
        clues: [
          clue(1, secondSolution[0], 0),
          clue(2, secondSolution[3], 3),
          clue(3, secondSolution[5], 5),
        ],
      },
    ],
    walls: [
      {
        a: firstSolution.at(-1),
        b: secondSolution.at(-1),
      },
    ],
  };
}

function playLine(puzzle, paths, lineId) {
  let nextPaths = paths;
  let finalResult = null;

  for (const cell of puzzle.lines.find((line) => line.id === lineId).solution) {
    finalResult = applyMove(puzzle, nextPaths, lineId, cell);
    assert.equal(finalResult.accepted, true, finalResult.message);
    nextPaths = finalResult.paths;
  }

  return { paths: nextPaths, result: finalResult };
}

test("fixtures obey the current puzzle model", () => {
  assert.equal(validatePuzzle(createTwainFixture()).valid, true);
});

test("each line must start on its own clue one", () => {
  const puzzle = createTwainFixture();
  const paths = createEmptyPaths(puzzle);
  const result = applyMove(puzzle, paths, "a", { row: 0, col: 1 });

  assert.equal(result.accepted, false);
  assert.equal(result.kind, "wrong-start");
});

test("line identity can be resolved from clues and existing paths", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);

  assert.equal(lineIdAtTarget(puzzle, paths, puzzle.lines[1].clues[0]), "b");
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[1]).paths;
  assert.equal(lineIdAtTarget(puzzle, paths, puzzle.lines[0].solution[1]), "a");
});

test("new moves must be adjacent", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  const result = applyMove(puzzle, paths, "a", { row: 1, col: 2 });

  assert.equal(result.accepted, false);
  assert.equal(result.kind, "not-adjacent");
});

test("walls reject otherwise adjacent moves", () => {
  const puzzle = createTwainFixture();
  puzzle.walls.push({ a: { row: 0, col: 0 }, b: { row: 1, col: 0 } });
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", { row: 0, col: 0 }).paths;
  const result = applyMove(puzzle, paths, "a", { row: 1, col: 0 });

  assert.equal(validatePuzzle(puzzle).valid, true);
  assert.equal(result.accepted, false);
  assert.equal(result.kind, "wall");
});

test("numbered clues are enforced independently for each line", () => {
  const puzzle = createTwainFixture();
  puzzle.lines[0].clues = [
    clue(1, puzzle.lines[0].solution[0], 0),
    clue(2, puzzle.lines[0].solution[2], 2),
    clue(3, { row: 1, col: 0 }, 4),
    clue(4, puzzle.lines[0].solution[5], 5),
  ];
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  const result = applyMove(puzzle, paths, "a", { row: 1, col: 0 });

  assert.equal(result.accepted, false);
  assert.equal(result.kind, "wrong-clue");
  assert.equal(nextExpectedClue(puzzle, paths, "a"), 2);

  const independent = createTwainFixture();
  const independentPaths = applyMove(
    independent,
    createEmptyPaths(independent),
    "a",
    independent.lines[0].solution[0],
  ).paths;
  assert.equal(nextExpectedClue(independent, independentPaths, "a"), 2);
  assert.equal(nextExpectedClue(independent, independentPaths, "b"), 1);
});

test("a line cannot occupy the other line's clue", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;

  const adjacentPuzzle = structuredClone(puzzle);
  adjacentPuzzle.lines[1].clues[1] = {
    value: 2,
    row: 0,
    col: 1,
    solutionIndex: 3,
  };
  const reserved = applyMove(
    adjacentPuzzle,
    paths,
    "a",
    { row: 0, col: 1 },
  );
  assert.equal(reserved.accepted, false);
  assert.equal(reserved.kind, "other-line-clue");
});

test("two lines cannot share a cell", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[1]).paths;
  paths = applyMove(puzzle, paths, "b", puzzle.lines[1].solution[0]).paths;

  const occupied = { ...paths, b: [{ row: 0, col: 2 }] };
  const result = applyMove(puzzle, occupied, "a", { row: 0, col: 2 });

  assert.equal(result.accepted, false);
  assert.equal(result.kind, "occupied");
});

test("Twain permits one line to finish before the other", () => {
  const puzzle = createTwainFixture();
  const first = playLine(puzzle, createEmptyPaths(puzzle), "a");

  assert.equal(first.result.accepted, true);
  assert.equal(first.result.kind, "line-complete");
  assert.equal(first.result.complete, false);
});

test("moving onto the active line's predecessor backtracks one cell", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);

  for (const cell of puzzle.lines[0].solution.slice(0, 4)) {
    paths = applyMove(puzzle, paths, "a", cell).paths;
  }

  paths = applyMove(puzzle, paths, "b", puzzle.lines[1].solution[0]).paths;
  const before = structuredClone(paths);
  const firstBacktrack = applyMove(
    puzzle,
    paths,
    "a",
    puzzle.lines[0].solution[2],
  );

  assert.equal(firstBacktrack.accepted, true);
  assert.equal(firstBacktrack.kind, "backtrack");
  assert.deepEqual(
    firstBacktrack.paths.a,
    puzzle.lines[0].solution.slice(0, 3),
  );
  assert.deepEqual(firstBacktrack.paths.b, before.b);
  assert.deepEqual(paths, before);

  const secondBacktrack = applyMove(
    puzzle,
    firstBacktrack.paths,
    "a",
    puzzle.lines[0].solution[1],
  );

  assert.equal(secondBacktrack.accepted, true);
  assert.equal(secondBacktrack.kind, "backtrack");
  assert.deepEqual(
    secondBacktrack.paths.a,
    puzzle.lines[0].solution.slice(0, 2),
  );

  const completed = playLine(puzzle, createEmptyPaths(puzzle), "a").paths;
  const reopened = applyMove(
    puzzle,
    completed,
    "a",
    puzzle.lines[0].solution.at(-2),
  );

  assert.equal(reopened.accepted, true);
  assert.equal(reopened.kind, "backtrack");
  assert.deepEqual(reopened.paths.a, puzzle.lines[0].solution.slice(0, -1));
  assert.deepEqual(completed.a, puzzle.lines[0].solution);
});

test("moving onto an older adjacent active-line cell is rejected", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);

  for (const cell of puzzle.lines[0].solution) {
    paths = applyMove(puzzle, paths, "a", cell).paths;
  }

  const target = puzzle.lines[0].solution[2];
  assert.equal(manhattanDistance(paths.a.at(-1), target), 1);

  const before = structuredClone(paths);
  const result = applyMove(puzzle, paths, "a", target);

  assert.equal(result.accepted, false);
  assert.equal(result.kind, "visited");
  assert.match(result.message, /one cell at a time/);
  assert.deepEqual(result.paths, before);
  assert.deepEqual(paths, before);
});

test("an explicit path-cell rewind removes the complete suffix immutably", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);

  for (const cell of puzzle.lines[0].solution.slice(0, 5)) {
    paths = applyMove(puzzle, paths, "a", cell).paths;
  }

  paths = applyMove(puzzle, paths, "b", puzzle.lines[1].solution[0]).paths;
  const before = structuredClone(paths);
  const result = rewindToPathCell(
    puzzle,
    paths,
    "a",
    puzzle.lines[0].solution[1],
  );

  assert.equal(result.accepted, true);
  assert.equal(result.kind, "rewind");
  assert.deepEqual(result.paths.a, puzzle.lines[0].solution.slice(0, 2));
  assert.deepEqual(result.paths.b, before.b);
  assert.deepEqual(paths, before);
});

test("an explicit path-cell rewind quietly ignores the tail and non-path cells", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);

  for (const cell of puzzle.lines[0].solution.slice(0, 3)) {
    paths = applyMove(puzzle, paths, "a", cell).paths;
  }

  const tail = rewindToPathCell(
    puzzle,
    paths,
    "a",
    puzzle.lines[0].solution[2],
  );
  const absent = rewindToPathCell(puzzle, paths, "a", { row: 2, col: 3 });

  assert.equal(tail.accepted, false);
  assert.equal(tail.kind, "same-cell");
  assert.equal(tail.quiet, true);
  assert.equal(absent.accepted, false);
  assert.equal(absent.kind, "not-on-path");
  assert.equal(absent.quiet, true);
  assert.equal(tail.paths, paths);
  assert.equal(absent.paths, paths);
});

test("both complete witness lines are accepted as solved", () => {
  const puzzle = createTwainFixture();
  const first = playLine(puzzle, createEmptyPaths(puzzle), "a");
  const second = playLine(puzzle, first.paths, "b");

  assert.equal(second.result.complete, true);
  assert.equal(second.result.kind, "complete");
  assert.equal(isSolved(puzzle, second.paths), true);
});

test("Twain accepts a valid partition with different line lengths from its witness", () => {
  const witnessA = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ];
  const witnessB = [
    { row: 2, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 2, col: 3 },
  ];
  const puzzle = {
    version: PUZZLE_VERSION,
    difficulty: "easy",
    seed: "alternate-partition",
    rows: 3,
    cols: 4,
    lines: [
      {
        id: "a",
        solution: witnessA,
        clues: [clue(1, witnessA[0], 0), clue(2, witnessA.at(-1), 3)],
      },
      {
        id: "b",
        solution: witnessB,
        clues: [clue(1, witnessB[0], 0), clue(2, witnessB.at(-1), 7)],
      },
    ],
    walls: [],
  };
  const alternateA = [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 0, col: 3 },
  ];
  const alternateB = [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 2, col: 3 },
  ];

  assert.equal(validatePuzzle(puzzle).valid, true);
  assert.notEqual(alternateA.length, witnessA.length);
  assert.notEqual(alternateB.length, witnessB.length);
  assert.equal(isSolved(puzzle, { a: alternateA, b: alternateB }), true);
});

test("Hint clears divergent suffixes and advances the active witness", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  paths = applyMove(puzzle, paths, "a", { row: 1, col: 0 }).paths;
  paths = applyMove(puzzle, paths, "b", puzzle.lines[1].solution[0]).paths;

  const hint = hintPaths(puzzle, paths, "a");
  assert.equal(hint.corrected, true);
  assert.deepEqual(hint.paths.a, puzzle.lines[0].solution.slice(0, 2));
  assert.deepEqual(hint.paths.b, puzzle.lines[1].solution.slice(0, 1));
});

test("Hint starts an empty board and Clear remains immutable", () => {
  const puzzle = createTwainFixture();
  const paths = createEmptyPaths(puzzle);
  const hint = hintPaths(puzzle, paths, "a");

  assert.deepEqual(hint.paths.a, [puzzle.lines[0].solution[0]]);
  assert.deepEqual(hint.paths.b, []);
  assert.deepEqual(paths, { a: [], b: [] });
  assert.deepEqual(clearPaths(puzzle), { a: [], b: [] });
});

test("global Undo restores the most recent cross-line snapshot", () => {
  const puzzle = createTwainFixture();
  let paths = createEmptyPaths(puzzle);
  const history = [snapshotPlayState(paths, "a")];
  paths = applyMove(puzzle, paths, "a", puzzle.lines[0].solution[0]).paths;
  history.push(snapshotPlayState(paths, "a"));
  paths = applyMove(puzzle, paths, "b", puzzle.lines[1].solution[0]).paths;

  const undone = undoPlayState(history, snapshotPlayState(paths, "b"));
  assert.equal(undone.changed, true);
  assert.equal(undone.state.activeLineId, "a");
  assert.deepEqual(undone.state.paths.a, [puzzle.lines[0].solution[0]]);
  assert.deepEqual(undone.state.paths.b, []);
});

test("direction helper maps cardinal moves", () => {
  const origin = { row: 4, col: 7 };
  assert.deepEqual(adjacentCell(origin, "up"), { row: 3, col: 7 });
  assert.deepEqual(adjacentCell(origin, "down"), { row: 5, col: 7 });
  assert.deepEqual(adjacentCell(origin, "left"), { row: 4, col: 6 });
  assert.deepEqual(adjacentCell(origin, "right"), { row: 4, col: 8 });
});
