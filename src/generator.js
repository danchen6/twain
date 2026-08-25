import { analyzePuzzleDifficulty } from "./solver.js";

export const PUZZLE_VERSION = 4;

const LINE_IDS = Object.freeze(["a", "b"]);

export const DIFFICULTY_PROFILES = Object.freeze({
  easy: Object.freeze({
    label: "Easy",
    rows: 5,
    cols: 5,
    clueCount: 10,
    wallCount: 1,
    backbiteFactor: 32,
    candidateCount: 5,
    selectionQuantile: 0.65,
    analysisNodeLimit: 5_000,
    analysisSolutionLimit: 4,
  }),
  medium: Object.freeze({
    label: "Medium",
    rows: 6,
    cols: 6,
    clueCount: 10,
    wallCount: 3,
    backbiteFactor: 40,
    candidateCount: 4,
    selectionQuantile: 0.8,
    analysisNodeLimit: 10_000,
    analysisSolutionLimit: 4,
  }),
  hard: Object.freeze({
    label: "Hard",
    rows: 7,
    cols: 7,
    clueCount: 11,
    wallCount: 6,
    backbiteFactor: 48,
    candidateCount: 7,
    selectionQuantile: 0.9,
    analysisNodeLimit: 25_000,
    analysisSolutionLimit: 4,
  }),
  extra: Object.freeze({
    label: "Extra",
    rows: 8,
    cols: 8,
    clueCount: 14,
    wallCount: 10,
    backbiteFactor: 60,
    candidateCount: 6,
    selectionQuantile: 0.95,
    analysisNodeLimit: 50_000,
    analysisSolutionLimit: 8,
  }),
  ultra: Object.freeze({
    label: "Ultra",
    rows: 10,
    cols: 10,
    clueCount: 20,
    wallCount: 18,
    backbiteFactor: 72,
    candidateCount: 6,
    selectionQuantile: 1,
    analysisNodeLimit: 100_000,
    analysisSolutionLimit: 12,
  }),
});

export function isDifficulty(value) {
  return Object.hasOwn(DIFFICULTY_PROFILES, value);
}

export function cellKey(cell) {
  return `${cell?.row},${cell?.col}`;
}

export function sameCell(a, b) {
  return Boolean(a && b) && a.row === b.row && a.col === b.col;
}

export function edgeKey(a, b) {
  const keys = [cellKey(a), cellKey(b)].sort();
  return `${keys[0]}|${keys[1]}`;
}

export function manhattanDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function isInBounds(cell, rows, cols) {
  return (
    Number.isInteger(cell?.row) &&
    Number.isInteger(cell?.col) &&
    cell.row >= 0 &&
    cell.row < rows &&
    cell.col >= 0 &&
    cell.col < cols
  );
}

export function createSeededRandom(seed) {
  const normalizedSeed = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash ^= normalizedSeed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInteger(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function shuffle(items, random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(random, 0, index);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function gridNeighbors(cell, rows, cols) {
  return [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ].filter((neighbor) => isInBounds(neighbor, rows, cols));
}

function createSerpentinePath(rows, cols) {
  const path = [];

  for (let row = 0; row < rows; row += 1) {
    const columns = Array.from({ length: cols }, (_, col) => col);

    if (row % 2 === 1) {
      columns.reverse();
    }

    for (const col of columns) {
      path.push({ row, col });
    }
  }

  return path;
}

function randomizeHamiltonianPath(
  initialPath,
  rows,
  cols,
  random,
  moveCount,
) {
  let path = initialPath.map((cell) => ({ ...cell }));

  for (let move = 0; move < moveCount; move += 1) {
    const mutateStart = random() < 0.5;
    const endpointIndex = mutateStart ? 0 : path.length - 1;
    const endpoint = path[endpointIndex];
    const indexByCell = new Map(
      path.map((cell, index) => [cellKey(cell), index]),
    );

    const candidates = gridNeighbors(endpoint, rows, cols)
      .map((neighbor) => indexByCell.get(cellKey(neighbor)))
      .filter((index) =>
        mutateStart ? index > 1 : index < path.length - 2,
      );

    if (candidates.length === 0) {
      continue;
    }

    const biteIndex = candidates[randomInteger(random, 0, candidates.length - 1)];

    if (mutateStart) {
      path = path.slice(0, biteIndex).reverse().concat(path.slice(biteIndex));
    } else {
      path = path
        .slice(0, biteIndex + 1)
        .concat(path.slice(biteIndex + 1).reverse());
    }
  }

  if (random() < 0.5) {
    path.reverse();
  }

  return path;
}

function chooseClueIndices(cellCount, clueCount, random) {
  const indices = [0];
  const averageGap = (cellCount - 1) / (clueCount - 1);
  let previousIndex = 0;

  for (let clueSlot = 1; clueSlot < clueCount - 1; clueSlot += 1) {
    const remainingInteriorClues = clueCount - clueSlot - 2;
    const minimum = previousIndex + 1;
    const maximum = cellCount - 2 - remainingInteriorClues;
    const center = Math.round(clueSlot * averageGap);
    const jitter = Math.max(1, Math.floor(averageGap * 0.38));
    const lower = Math.max(minimum, center - jitter);
    const upper = Math.min(maximum, center + jitter);
    const index = randomInteger(random, lower, upper);

    indices.push(index);
    previousIndex = index;
  }

  indices.push(cellCount - 1);
  return indices;
}

function createLine(id, solution, clueCount, random) {
  const copiedSolution = solution.map((cell) => ({ ...cell }));
  const clueIndices = chooseClueIndices(copiedSolution.length, clueCount, random);
  const clues = clueIndices.map((solutionIndex, index) => ({
    value: index + 1,
    ...copiedSolution[solutionIndex],
    solutionIndex,
  }));

  return { id, clues, solution: copiedSolution };
}

function allocateTwainClues(totalClues, firstLength, totalCells) {
  const proportional = Math.round((totalClues * firstLength) / totalCells);
  const first = Math.min(totalClues - 2, Math.max(2, proportional));
  return [first, totalClues - first];
}

function listGridEdges(rows, cols) {
  const edges = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = { row, col };

      if (col + 1 < cols) {
        edges.push({ a: cell, b: { row, col: col + 1 } });
      }

      if (row + 1 < rows) {
        edges.push({ a: cell, b: { row: row + 1, col } });
      }
    }
  }

  return edges;
}

function createWalls(lines, rows, cols, wallCount, random, requiredWalls = []) {
  const solutionEdges = new Set();

  for (const line of lines) {
    for (let index = 1; index < line.solution.length; index += 1) {
      solutionEdges.add(edgeKey(line.solution[index - 1], line.solution[index]));
    }
  }

  const required = requiredWalls
    .slice(0, wallCount)
    .map(({ a, b }) => ({ a: { ...a }, b: { ...b } }));
  const requiredKeys = new Set(required.map(({ a, b }) => edgeKey(a, b)));
  const candidates = listGridEdges(rows, cols).filter(({ a, b }) => {
    const key = edgeKey(a, b);
    return !solutionEdges.has(key) && !requiredKeys.has(key);
  });

  const remainingCount = Math.max(0, wallCount - required.length);
  return required.concat(
    shuffle(candidates, random)
      .slice(0, remainingCount)
      .map(({ a, b }) => ({ a: { ...a }, b: { ...b } })),
  );
}

export function validatePuzzle(puzzle) {
  const errors = [];

  if (!puzzle || typeof puzzle !== "object") {
    return { valid: false, errors: ["Puzzle must be an object."] };
  }

  const { rows, cols } = puzzle;
  const dimensionsAreValid =
    Number.isInteger(rows) && rows > 1 && Number.isInteger(cols) && cols > 1;

  if (puzzle.version !== PUZZLE_VERSION) {
    errors.push(`Puzzle version must be ${PUZZLE_VERSION}.`);
  }

  if (!isDifficulty(puzzle.difficulty)) {
    errors.push("Puzzle difficulty is unknown.");
  }

  if (typeof puzzle.seed !== "string" || puzzle.seed.length === 0) {
    errors.push("Puzzle seed must be a non-empty string.");
  }

  if (!dimensionsAreValid) {
    errors.push("Puzzle dimensions must be integers greater than one.");
  }

  if (!Array.isArray(puzzle.lines)) {
    errors.push("Puzzle lines must be an array.");
  }

  if (!Array.isArray(puzzle.walls)) {
    errors.push("Puzzle walls must be an array.");
  }

  if (
    !dimensionsAreValid ||
    !Array.isArray(puzzle.lines) ||
    !Array.isArray(puzzle.walls)
  ) {
    return { valid: errors.length === 0, errors };
  }

  const expectedLineIds = LINE_IDS;

  if (puzzle.lines.length !== expectedLineIds.length) {
    errors.push(`Twain puzzles must contain ${expectedLineIds.length} lines.`);
  }

  const allSolutionCells = [];
  const solutionEdges = new Set();

  puzzle.lines.forEach((line, lineIndex) => {
    const expectedId = expectedLineIds[lineIndex];

    if (line?.id !== expectedId) {
      errors.push(`Line ${lineIndex} must use id ${expectedId}.`);
    }

    if (!Array.isArray(line?.solution)) {
      errors.push(`Line ${line?.id ?? lineIndex} solution must be an array.`);
    }

    if (!Array.isArray(line?.clues) || line.clues.length < 2) {
      errors.push(`Line ${line?.id ?? lineIndex} must contain at least two clues.`);
    }

    if (!Array.isArray(line?.solution) || !Array.isArray(line?.clues)) {
      return;
    }

    if (line.solution.length < 2) {
      errors.push(`Line ${line.id} solution must contain at least two cells.`);
    }

    const solutionKeys = line.solution.map(cellKey);

    if (new Set(solutionKeys).size !== solutionKeys.length) {
      errors.push(`Line ${line.id} solution must not repeat a cell.`);
    }

    const solutionIsInBounds = line.solution.every((cell) =>
      isInBounds(cell, rows, cols),
    );

    if (!solutionIsInBounds) {
      errors.push(`Every line ${line.id} solution cell must be in bounds.`);
    }

    if (solutionIsInBounds) {
      for (let index = 1; index < line.solution.length; index += 1) {
        if (manhattanDistance(line.solution[index - 1], line.solution[index]) !== 1) {
          errors.push(`Line ${line.id} solution step ${index} is not orthogonally adjacent.`);
          break;
        }

        solutionEdges.add(edgeKey(line.solution[index - 1], line.solution[index]));
      }
    }

    let previousSolutionIndex = -1;

    line.clues.forEach((clue, clueIndex) => {
      if (clue?.value !== clueIndex + 1) {
        errors.push(`Line ${line.id} clue values must be contiguous from one.`);
      }

      if (!isInBounds(clue, rows, cols)) {
        errors.push(`Line ${line.id} clue ${clueIndex + 1} is out of bounds.`);
      }

      if (
        !Number.isInteger(clue?.solutionIndex) ||
        clue.solutionIndex < 0 ||
        clue.solutionIndex >= line.solution.length
      ) {
        errors.push(`Line ${line.id} clue ${clueIndex + 1} has an invalid solution index.`);
        return;
      }

      if (clue.solutionIndex <= previousSolutionIndex) {
        errors.push(`Line ${line.id} clue solution indices must strictly increase.`);
      }

      if (!sameCell(clue, line.solution[clue.solutionIndex])) {
        errors.push(`Line ${line.id} clue ${clueIndex + 1} does not match its solution cell.`);
      }

      previousSolutionIndex = clue.solutionIndex;
    });

    const firstClue = line.clues[0];
    const finalClue = line.clues[line.clues.length - 1];

    if (firstClue?.solutionIndex !== 0) {
      errors.push(`Line ${line.id} clue one must start its solution.`);
    }

    if (finalClue?.solutionIndex !== line.solution.length - 1) {
      errors.push(`Line ${line.id} final clue must end its solution.`);
    }

    allSolutionCells.push(...line.solution);
  });

  const expectedCellCount = rows * cols;
  const allSolutionKeys = allSolutionCells.map(cellKey);

  if (allSolutionCells.length !== expectedCellCount) {
    errors.push("Line solutions must collectively contain every board cell.");
  }

  if (new Set(allSolutionKeys).size !== allSolutionKeys.length) {
    errors.push("Line solutions must not share a cell.");
  }

  const wallKeys = new Set();

  puzzle.walls.forEach((wall, wallIndex) => {
    if (
      !isInBounds(wall?.a, rows, cols) ||
      !isInBounds(wall?.b, rows, cols) ||
      manhattanDistance(wall.a, wall.b) !== 1
    ) {
      errors.push(`Wall ${wallIndex} must join adjacent in-bounds cells.`);
      return;
    }

    const key = edgeKey(wall.a, wall.b);

    if (wallKeys.has(key)) {
      errors.push(`Wall ${wallIndex} duplicates another wall.`);
    }

    if (solutionEdges.has(key)) {
      errors.push(`Wall ${wallIndex} crosses a witness line.`);
    }

    wallKeys.add(key);
  });

  return { valid: errors.length === 0, errors };
}

function generateCandidate(
  difficulty,
  normalizedSeed,
  profile,
  candidateIndex,
) {
  const random = createSeededRandom(
    `${PUZZLE_VERSION}:${difficulty}:${normalizedSeed}:candidate:${candidateIndex}`,
  );
  const initialPath = createSerpentinePath(profile.rows, profile.cols);
  const hamiltonianPath = randomizeHamiltonianPath(
    initialPath,
    profile.rows,
    profile.cols,
    random,
    profile.rows * profile.cols * profile.backbiteFactor,
  );
  const minimumSplit = Math.ceil(hamiltonianPath.length * 0.4);
  const maximumSplit = Math.floor(hamiltonianPath.length * 0.6);
  const splitIndex = randomInteger(random, minimumSplit, maximumSplit);
  const firstSolution = hamiltonianPath.slice(0, splitIndex);
  const secondSolution = hamiltonianPath.slice(splitIndex).reverse();
  const [firstClueCount, secondClueCount] = allocateTwainClues(
    profile.clueCount,
    firstSolution.length,
    hamiltonianPath.length,
  );
  const lines = [
    createLine("a", firstSolution, firstClueCount, random),
    createLine("b", secondSolution, secondClueCount, random),
  ];
  const requiredWalls = [
    {
      a: firstSolution[firstSolution.length - 1],
      b: secondSolution[secondSolution.length - 1],
    },
  ];

  const walls = createWalls(
    lines,
    profile.rows,
    profile.cols,
    profile.wallCount,
    random,
    requiredWalls,
  );
  const puzzle = {
    version: PUZZLE_VERSION,
    difficulty,
    seed: normalizedSeed,
    rows: profile.rows,
    cols: profile.cols,
    lines,
    walls,
  };

  return puzzle;
}

function selectDifficultyCandidate(candidates, profile) {
  const analyzed = candidates.map((puzzle, candidateIndex) => ({
    analysis: analyzePuzzleDifficulty(puzzle, {
      nodeLimit: profile.analysisNodeLimit,
      solutionLimit: profile.analysisSolutionLimit,
    }),
    candidateIndex,
    puzzle,
  }));
  const resolved = analyzed
    .filter(({ analysis }) => analysis.solved)
    .sort(
      (left, right) =>
        left.analysis.score - right.analysis.score ||
        left.candidateIndex - right.candidateIndex,
    );

  if (resolved.length === 0) {
    return candidates[0];
  }

  const selectedIndex = Math.min(
    resolved.length - 1,
    Math.round(profile.selectionQuantile * (resolved.length - 1)),
  );

  return resolved[selectedIndex].puzzle;
}

export function generatePuzzle(
  difficulty,
  { seed } = {},
) {
  if (!isDifficulty(difficulty)) {
    throw new RangeError(`Unknown difficulty: ${difficulty}`);
  }

  const normalizedSeed = String(seed ?? "").trim();

  if (normalizedSeed.length === 0) {
    throw new TypeError("Seed must not be empty.");
  }

  const profile = DIFFICULTY_PROFILES[difficulty];
  const candidates = Array.from(
    { length: profile.candidateCount },
    (_, candidateIndex) => {
      const puzzle = generateCandidate(
        difficulty,
        normalizedSeed,
        profile,
        candidateIndex,
      );
      const validation = validatePuzzle(puzzle);

      if (!validation.valid) {
        throw new Error(
          `Generated an invalid puzzle candidate: ${validation.errors.join(" ")}`,
        );
      }

      return puzzle;
    },
  );
  const puzzle = selectDifficultyCandidate(candidates, profile);
  const validation = validatePuzzle(puzzle);

  if (!validation.valid) {
    throw new Error(`Generated an invalid puzzle: ${validation.errors.join(" ")}`);
  }

  return puzzle;
}
