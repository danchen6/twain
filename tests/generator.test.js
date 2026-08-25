import assert from "node:assert/strict";
import test from "node:test";

import {
  DIFFICULTY_PROFILES,
  edgeKey,
  generatePuzzle,
  manhattanDistance,
  validatePuzzle,
} from "../src/generator.js";
import {
  applyMove,
  createEmptyPaths,
  hasWallBetween,
  isSolved,
} from "../src/game.js";
import { analyzePuzzleDifficulty } from "../src/solver.js";

test("identical difficulty and seed produce identical puzzles", () => {
  for (const difficulty of Object.keys(DIFFICULTY_PROFILES)) {
    const options = { seed: "deterministic-board" };
    const first = generatePuzzle(difficulty, options);
    const second = generatePuzzle(difficulty, options);
    assert.deepEqual(second, first);
  }
});

test("difficulty profiles expose their promised board shape", () => {
  for (const [difficulty, profile] of Object.entries(DIFFICULTY_PROFILES)) {
    const puzzle = generatePuzzle(difficulty, { seed: "profile-contract" });
    const clueCount = puzzle.lines.reduce(
      (total, line) => total + line.clues.length,
      0,
    );

    assert.equal(puzzle.rows, profile.rows);
    assert.equal(puzzle.cols, profile.cols);
    assert.deepEqual(puzzle.lines.map(({ id }) => id), ["a", "b"]);
    assert.equal(clueCount, profile.clueCount);
    assert.equal(puzzle.walls.length, profile.wallCount);
    assert.equal(Object.hasOwn(puzzle, "mode"), false);
  }

  assert.deepEqual(
    Object.keys(DIFFICULTY_PROFILES),
    ["easy", "medium", "hard", "extra", "ultra"],
  );
  assert.equal(DIFFICULTY_PROFILES.extra.rows, 8);
  assert.equal(DIFFICULTY_PROFILES.extra.cols, 8);
  assert.equal(DIFFICULTY_PROFILES.ultra.rows, 10);
  assert.equal(DIFFICULTY_PROFILES.ultra.cols, 10);
});

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

test("solver-calibrated difficulty rises across a deterministic seed cohort", () => {
  const difficulties = Object.keys(DIFFICULTY_PROFILES);
  const medians = difficulties.map((difficulty) => {
    const scores = [];

    for (let seedIndex = 0; seedIndex < 10; seedIndex += 1) {
      const puzzle = generatePuzzle(difficulty, {
        seed: `calibration-${seedIndex}`,
      });
      const analysis = analyzePuzzleDifficulty(puzzle, {
        nodeLimit: 100_000,
        solutionLimit: 4,
      });

      assert.equal(
        analysis.solved,
        true,
        `${difficulty}/${seedIndex} exceeded the calibration search`,
      );
      scores.push(analysis.score);
    }

    return median(scores);
  });

  for (let index = 1; index < medians.length; index += 1) {
    assert.ok(
      medians[index] > medians[index - 1],
      `difficulty medians are not increasing: ${JSON.stringify(medians)}`,
    );
  }
});

test("generated boards validate and every witness line completes through game rules", () => {
  for (const difficulty of Object.keys(DIFFICULTY_PROFILES)) {
    const sampleCount = difficulty === "ultra" ? 12 : difficulty === "extra" ? 24 : 40;

    for (let seedIndex = 0; seedIndex < sampleCount; seedIndex += 1) {
      const puzzle = generatePuzzle(difficulty, {
        seed: `property-${difficulty}-${seedIndex}`,
      });
      const validation = validatePuzzle(puzzle);
      let paths = createEmptyPaths(puzzle);

      assert.deepEqual(validation.errors, []);
      assert.equal(validation.valid, true);

      for (const line of puzzle.lines) {
        for (const cell of line.solution) {
          const result = applyMove(puzzle, paths, line.id, cell);
          assert.equal(
            result.accepted,
            true,
            `${difficulty}/${seedIndex}/${line.id} rejected ${JSON.stringify(cell)}: ${result.message}`,
          );
          paths = result.paths;
        }
      }

      assert.equal(isSolved(puzzle, paths), true);
    }
  }
});

test("Twain witnesses are balanced, disjoint, exhaustive, and separated at their finals", () => {
  for (const difficulty of Object.keys(DIFFICULTY_PROFILES)) {
    const sampleCount = difficulty === "ultra" ? 12 : difficulty === "extra" ? 24 : 40;

    for (let seedIndex = 0; seedIndex < sampleCount; seedIndex += 1) {
      const puzzle = generatePuzzle(difficulty, {
        seed: `partition-${difficulty}-${seedIndex}`,
      });
      const [first, second] = puzzle.lines;
      const allKeys = puzzle.lines.flatMap((line) =>
        line.solution.map(({ row, col }) => `${row},${col}`),
      );
      const firstRatio = first.solution.length / allKeys.length;

      assert.ok(firstRatio >= 0.4 && firstRatio <= 0.6);
      assert.equal(new Set(allKeys).size, puzzle.rows * puzzle.cols);
      assert.equal(
        manhattanDistance(first.solution.at(-1), second.solution.at(-1)),
        1,
      );
      assert.equal(
        hasWallBetween(puzzle, first.solution.at(-1), second.solution.at(-1)),
        true,
      );
    }
  }
});

test("walls never cross any witness line", () => {
  const puzzle = generatePuzzle("hard", {
    seed: "wall-contract",
  });
  const pathEdges = new Set();

  for (const line of puzzle.lines) {
    for (let index = 1; index < line.solution.length; index += 1) {
      pathEdges.add(edgeKey(line.solution[index - 1], line.solution[index]));
    }
  }

  for (const wall of puzzle.walls) {
    assert.equal(pathEdges.has(edgeKey(wall.a, wall.b)), false);
  }
});

test("different seeds create meaningful Twain route diversity", () => {
  const signatures = new Set();

  for (let index = 0; index < 20; index += 1) {
    const puzzle = generatePuzzle("medium", {
      seed: `diversity-${index}`,
    });
    signatures.add(
      puzzle.lines
        .map((line) =>
          line.solution.map(({ row, col }) => `${row}${col}`).join(""),
        )
        .join("|"),
    );
  }

  assert.ok(signatures.size >= 18);
});

test("bad generator inputs fail explicitly", () => {
  assert.throws(
    () => generatePuzzle("impossible", { seed: "x" }),
    RangeError,
  );
  assert.throws(() => generatePuzzle("easy"), TypeError);
  assert.throws(() => generatePuzzle("easy", { seed: "  " }), TypeError);
});

test("validator rejects a wall placed across a witness", () => {
  const puzzle = generatePuzzle("easy", {
    seed: "tamper-detection",
  });
  const tampered = structuredClone(puzzle);
  tampered.walls = [
    { a: tampered.lines[0].solution[0], b: tampered.lines[0].solution[1] },
  ];
  const validation = validatePuzzle(tampered);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.some((error) => error.includes("crosses a witness")),
  );
});

test("validator rejects shared witness cells", () => {
  const puzzle = generatePuzzle("easy", {
    seed: "shared-cell",
  });
  const tampered = structuredClone(puzzle);
  const shared = tampered.lines[0].solution[0];
  tampered.lines[1].solution[0] = { ...shared };
  tampered.lines[1].clues[0] = {
    ...tampered.lines[1].clues[0],
    ...shared,
  };
  const validation = validatePuzzle(tampered);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes("Line solutions must not share a cell."));
});

test("validator reports malformed cells instead of throwing", () => {
  const puzzle = generatePuzzle("easy", {
    seed: "malformed-cell",
  });
  const malformed = structuredClone(puzzle);
  malformed.lines[0].solution[3] = null;

  assert.doesNotThrow(() => validatePuzzle(malformed));
  const validation = validatePuzzle(malformed);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.includes("Every line a solution cell must be in bounds."),
  );
});
