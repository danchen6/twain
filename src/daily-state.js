import {
  DAILY_RUN_VERSION,
  dailyDifficultyAt,
  dailySchedule,
  dailyStageSeed,
} from "./daily.js";
import {
  applyMove,
  clonePaths,
  createEmptyPaths,
  isSolved,
  snapshotPlayState,
} from "./game.js";

const MAX_STORED_HISTORY = 256;

function isNonnegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function hasValidHeader(candidate, dateKey) {
  let schedule;

  try {
    schedule = dailySchedule(dateKey);
  } catch {
    return false;
  }

  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      candidate.version === DAILY_RUN_VERSION &&
      candidate.dateKey === dateKey &&
      Number.isInteger(candidate.stageIndex) &&
      candidate.stageIndex >= 0 &&
      candidate.stageIndex < schedule.length,
  );
}

function restorePaths(puzzle, candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  let paths = createEmptyPaths(puzzle);

  for (const line of puzzle.lines) {
    const storedPath = candidate[line.id];

    if (!Array.isArray(storedPath) || storedPath.length > puzzle.rows * puzzle.cols) {
      return null;
    }

    for (const cell of storedPath) {
      const result = applyMove(puzzle, paths, line.id, cell);

      if (!result.accepted) {
        return null;
      }

      paths = result.paths;
    }
  }

  return paths;
}

function restoreSnapshot(puzzle, candidate) {
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !puzzle.lines.some(({ id }) => id === candidate.activeLineId)
  ) {
    return null;
  }

  const paths = restorePaths(puzzle, candidate.paths);
  return paths ? snapshotPlayState(paths, candidate.activeLineId) : null;
}

export function storedDailyStageIndex(candidate, dateKey) {
  return hasValidHeader(candidate, dateKey) ? candidate.stageIndex : null;
}

export function createDailyPlay(dateKey, puzzle, stageIndex = 0) {
  const schedule = dailySchedule(dateKey);
  const difficulty = dailyDifficultyAt(dateKey, stageIndex);
  const seed = dailyStageSeed(dateKey, difficulty);

  if (puzzle.difficulty !== difficulty || puzzle.seed !== seed) {
    throw new RangeError("Puzzle does not match the daily stage.");
  }

  return {
    dateKey,
    schedule,
    stageIndex,
    elapsedMs: 0,
    paths: createEmptyPaths(puzzle),
    activeLineId: puzzle.lines[0].id,
    history: [],
    hints: 0,
    mistakes: 0,
    stageElapsedBaselineMs: 0,
    stageHintsBaseline: 0,
    stageMistakesBaseline: 0,
    stageCompleted: false,
    dailyComplete: false,
  };
}

export function restoreDailyPlay(candidate, dateKey, puzzle) {
  if (!hasValidHeader(candidate, dateKey)) {
    return null;
  }

  const schedule = dailySchedule(dateKey);
  const expectedDifficulty = dailyDifficultyAt(dateKey, candidate.stageIndex);
  const baselineValues = [
    candidate.stageElapsedBaselineMs,
    candidate.stageHintsBaseline,
    candidate.stageMistakesBaseline,
  ];
  const hasUnknownBaselines = baselineValues.every(
    (value) => value === null || value === undefined,
  );
  const hasValidBaselines =
    Number.isFinite(candidate.stageElapsedBaselineMs) &&
    candidate.stageElapsedBaselineMs >= 0 &&
    candidate.stageElapsedBaselineMs <= candidate.elapsedMs &&
    isNonnegativeInteger(candidate.stageHintsBaseline) &&
    candidate.stageHintsBaseline <= candidate.hints &&
    isNonnegativeInteger(candidate.stageMistakesBaseline) &&
    candidate.stageMistakesBaseline <= candidate.mistakes;

  if (
    puzzle.difficulty !== expectedDifficulty ||
    puzzle.seed !== dailyStageSeed(dateKey, expectedDifficulty) ||
    !Number.isFinite(candidate.elapsedMs) ||
    candidate.elapsedMs < 0 ||
    !isNonnegativeInteger(candidate.hints) ||
    !isNonnegativeInteger(candidate.mistakes) ||
    (!hasUnknownBaselines && !hasValidBaselines) ||
    !Array.isArray(candidate.history) ||
    candidate.history.length > MAX_STORED_HISTORY ||
    !puzzle.lines.some(({ id }) => id === candidate.activeLineId)
  ) {
    return null;
  }

  const paths = restorePaths(puzzle, candidate.paths);

  if (!paths) {
    return null;
  }

  const history = [];

  for (const storedSnapshot of candidate.history) {
    const snapshot = restoreSnapshot(puzzle, storedSnapshot);

    if (!snapshot) {
      return null;
    }

    history.push(snapshot);
  }

  const stageCompleted = isSolved(puzzle, paths);

  return {
    dateKey,
    schedule,
    stageIndex: candidate.stageIndex,
    elapsedMs: Math.floor(candidate.elapsedMs),
    paths,
    activeLineId: candidate.activeLineId,
    history,
    hints: candidate.hints,
    mistakes: candidate.mistakes,
    stageElapsedBaselineMs: hasValidBaselines
      ? Math.floor(candidate.stageElapsedBaselineMs)
      : null,
    stageHintsBaseline: hasValidBaselines
      ? candidate.stageHintsBaseline
      : null,
    stageMistakesBaseline: hasValidBaselines
      ? candidate.stageMistakesBaseline
      : null,
    stageCompleted,
    dailyComplete:
      stageCompleted && candidate.stageIndex === schedule.length - 1,
  };
}

export function createDailyStorageRecord(play, elapsedMs = play.elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError("Daily elapsed time must be nonnegative.");
  }

  return {
    version: DAILY_RUN_VERSION,
    dateKey: play.dateKey,
    stageIndex: play.stageIndex,
    elapsedMs: Math.floor(elapsedMs),
    paths: clonePaths(play.paths),
    activeLineId: play.activeLineId,
    history: play.history
      .slice(-MAX_STORED_HISTORY)
      .map(({ paths, activeLineId }) =>
        snapshotPlayState(paths, activeLineId),
      ),
    hints: play.hints,
    mistakes: play.mistakes,
    stageElapsedBaselineMs: play.stageElapsedBaselineMs,
    stageHintsBaseline: play.stageHintsBaseline,
    stageMistakesBaseline: play.stageMistakesBaseline,
  };
}
