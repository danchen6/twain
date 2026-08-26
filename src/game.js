import {
  cellKey,
  edgeKey,
  isInBounds,
  manhattanDistance,
  sameCell,
} from "./generator.js";

export const LINE_NAMES = Object.freeze({
  a: "Number line",
  b: "Letter line",
});

export const MOVE_MESSAGES = Object.freeze({
  adjacent: "Move to a neighboring cell.",
  wall: "A wall blocks that move.",
  order: "Follow this line's clues in order.",
  occupied: "The two lines cannot share a cell.",
  visited: "That cell is already part of this line. Backtrack along the route one cell at a time.",
  reserved: "That clue belongs to the other line.",
  finished: "That line already ends at its final clue.",
  solved: "Both paths complete — beautifully done.",
});

export function getLine(puzzle, lineId) {
  return puzzle.lines.find((line) => line.id === lineId) ?? null;
}

export function lineDisplayName(lineId) {
  return LINE_NAMES[lineId] ?? `Line ${lineId.toUpperCase()}`;
}

function alphabeticClue(value) {
  let remaining = value;
  let label = "";

  while (remaining > 0) {
    remaining -= 1;
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26);
  }

  return label;
}

export function clueDisplayValue(lineId, value) {
  return lineId === "b" ? alphabeticClue(value) : String(value);
}

export function clueValueAt(puzzle, lineId, cell) {
  return (
    getLine(puzzle, lineId)?.clues.find((clue) => sameCell(clue, cell))
      ?.value ?? null
  );
}

export function clueAtCell(puzzle, cell) {
  for (const line of puzzle.lines) {
    const clue = line.clues.find((candidate) => sameCell(candidate, cell));

    if (clue) {
      return { lineId: line.id, clue };
    }
  }

  return null;
}

export function hasWallBetween(puzzle, a, b) {
  const targetEdge = edgeKey(a, b);
  return puzzle.walls.some((wall) => edgeKey(wall.a, wall.b) === targetEdge);
}

export function createEmptyPaths(puzzle) {
  return Object.fromEntries(puzzle.lines.map((line) => [line.id, []]));
}

export function clonePaths(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([lineId, path]) => [
      lineId,
      path.map((cell) => ({ ...cell })),
    ]),
  );
}

export function totalPathLength(paths) {
  return Object.values(paths).reduce((total, path) => total + path.length, 0);
}

export function nextExpectedClue(puzzle, paths, lineId) {
  let expected = 1;

  for (const cell of paths[lineId] ?? []) {
    const clueValue = clueValueAt(puzzle, lineId, cell);

    if (clueValue === null) {
      continue;
    }

    if (clueValue !== expected) {
      return Number.NaN;
    }

    expected += 1;
  }

  return expected;
}

export function isLineComplete(puzzle, paths, lineId) {
  const line = getLine(puzzle, lineId);
  const path = paths[lineId] ?? [];
  return Boolean(
    line && path.length > 0 && sameCell(path[path.length - 1], line.clues.at(-1)),
  );
}

function pathIsValid(puzzle, line, path) {
  if (path.length < 2) {
    return false;
  }

  if (!sameCell(path[0], line.clues[0]) || !sameCell(path.at(-1), line.clues.at(-1))) {
    return false;
  }

  let expectedClue = 1;

  for (let index = 0; index < path.length; index += 1) {
    const cell = path[index];

    if (!isInBounds(cell, puzzle.rows, puzzle.cols)) {
      return false;
    }

    if (
      index > 0 &&
      (manhattanDistance(path[index - 1], cell) !== 1 ||
        hasWallBetween(puzzle, path[index - 1], cell))
    ) {
      return false;
    }

    const clueValue = clueValueAt(puzzle, line.id, cell);

    if (clueValue !== null) {
      if (clueValue !== expectedClue) {
        return false;
      }

      expectedClue += 1;
    }
  }

  return expectedClue === line.clues.length + 1;
}

export function isSolved(puzzle, paths) {
  const allCells = puzzle.lines.flatMap((line) => paths[line.id] ?? []);

  if (allCells.length !== puzzle.rows * puzzle.cols) {
    return false;
  }

  const uniqueCells = new Set(allCells.map(cellKey));

  if (uniqueCells.size !== allCells.length) {
    return false;
  }

  return puzzle.lines.every((line) =>
    pathIsValid(puzzle, line, paths[line.id] ?? []),
  );
}

export function lineIdAtTarget(puzzle, paths, target) {
  for (const line of puzzle.lines) {
    if ((paths[line.id] ?? []).some((cell) => sameCell(cell, target))) {
      return line.id;
    }
  }

  return clueAtCell(puzzle, target)?.lineId ?? null;
}

function copyPathsWith(paths, lineId, nextPath) {
  return {
    ...paths,
    [lineId]: nextPath.map((cell) => ({ ...cell })),
  };
}

function startMessage(lineId) {
  return `Start the ${lineDisplayName(lineId).toLowerCase()} on ${clueDisplayValue(lineId, 1)}.`;
}

function moveResult({
  accepted,
  paths,
  activeLineId,
  kind,
  message = "",
  quiet = false,
  puzzle,
}) {
  return {
    accepted,
    paths,
    activeLineId,
    kind,
    message,
    quiet,
    complete: accepted ? isSolved(puzzle, paths) : false,
  };
}

export function applyMove(puzzle, paths, activeLineId, target) {
  const line = getLine(puzzle, activeLineId);

  if (!line) {
    throw new RangeError(`Unknown line: ${activeLineId}`);
  }

  if (!isInBounds(target, puzzle.rows, puzzle.cols)) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "out-of-bounds",
      message: MOVE_MESSAGES.adjacent,
      puzzle,
    });
  }

  const path = paths[activeLineId] ?? [];
  const existingIndex = path.findIndex((cell) => sameCell(cell, target));

  if (existingIndex === path.length - 1 && path.length > 0) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "same-cell",
      quiet: true,
      puzzle,
    });
  }

  if (existingIndex >= 0 && existingIndex === path.length - 2) {
    return moveResult({
      accepted: true,
      paths: copyPathsWith(paths, activeLineId, path.slice(0, -1)),
      activeLineId,
      kind: "backtrack",
      puzzle,
    });
  }

  if (existingIndex >= 0) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "visited",
      message: MOVE_MESSAGES.visited,
      puzzle,
    });
  }

  const occupiedByOtherLine = puzzle.lines.some(
    (candidate) =>
      candidate.id !== activeLineId &&
      (paths[candidate.id] ?? []).some((cell) => sameCell(cell, target)),
  );

  if (occupiedByOtherLine) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "occupied",
      message: MOVE_MESSAGES.occupied,
      puzzle,
    });
  }

  const targetClue = clueAtCell(puzzle, target);

  if (targetClue && targetClue.lineId !== activeLineId) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "other-line-clue",
      message: `${MOVE_MESSAGES.reserved} Use ${lineDisplayName(targetClue.lineId)}.`,
      puzzle,
    });
  }

  if (path.length === 0) {
    if (clueValueAt(puzzle, activeLineId, target) !== 1) {
      return moveResult({
        accepted: false,
        paths,
        activeLineId,
        kind: "wrong-start",
        message: startMessage(activeLineId),
        puzzle,
      });
    }

    return moveResult({
      accepted: true,
      paths: copyPathsWith(paths, activeLineId, [target]),
      activeLineId,
      kind: "start",
      puzzle,
    });
  }

  if (isLineComplete(puzzle, paths, activeLineId)) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "finished-line",
      message: MOVE_MESSAGES.finished,
      puzzle,
    });
  }

  const tail = path[path.length - 1];

  if (manhattanDistance(tail, target) !== 1) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "not-adjacent",
      message: MOVE_MESSAGES.adjacent,
      puzzle,
    });
  }

  if (hasWallBetween(puzzle, tail, target)) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "wall",
      message: MOVE_MESSAGES.wall,
      puzzle,
    });
  }

  const targetClueValue = clueValueAt(puzzle, activeLineId, target);
  const expectedClue = nextExpectedClue(puzzle, paths, activeLineId);

  if (targetClueValue !== null && targetClueValue !== expectedClue) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "wrong-clue",
      message: MOVE_MESSAGES.order,
      puzzle,
    });
  }

  const nextPath = [...path, { row: target.row, col: target.col }];
  const nextPaths = copyPathsWith(paths, activeLineId, nextPath);
  const complete = isSolved(puzzle, nextPaths);
  const lineComplete = sameCell(target, line.clues.at(-1));

  return {
    accepted: true,
    paths: nextPaths,
    activeLineId,
    kind: complete ? "complete" : lineComplete ? "line-complete" : "extend",
    message: complete
      ? MOVE_MESSAGES.solved
      : lineComplete
        ? `${lineDisplayName(activeLineId)} complete. Continue the other line.`
        : "",
    quiet: false,
    complete,
  };
}

export function rewindToPathCell(puzzle, paths, activeLineId, target) {
  const line = getLine(puzzle, activeLineId);

  if (!line) {
    throw new RangeError(`Unknown line: ${activeLineId}`);
  }

  if (!isInBounds(target, puzzle.rows, puzzle.cols)) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "out-of-bounds",
      quiet: true,
      puzzle,
    });
  }

  const path = paths[activeLineId] ?? [];
  const targetIndex = path.findIndex((cell) => sameCell(cell, target));

  if (targetIndex === path.length - 1 && path.length > 0) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "same-cell",
      quiet: true,
      puzzle,
    });
  }

  if (targetIndex < 0) {
    return moveResult({
      accepted: false,
      paths,
      activeLineId,
      kind: "not-on-path",
      quiet: true,
      puzzle,
    });
  }

  return moveResult({
    accepted: true,
    paths: copyPathsWith(paths, activeLineId, path.slice(0, targetIndex + 1)),
    activeLineId,
    kind: "rewind",
    puzzle,
  });
}

export function clearPaths(puzzle) {
  return createEmptyPaths(puzzle);
}

export function snapshotPlayState(paths, activeLineId) {
  return { paths: clonePaths(paths), activeLineId };
}

export function undoPlayState(history, currentState) {
  if (history.length === 0) {
    return { history, state: currentState, changed: false };
  }

  const state = history[history.length - 1];
  return {
    history: history.slice(0, -1),
    state: snapshotPlayState(state.paths, state.activeLineId),
    changed: true,
  };
}

export function hintPaths(puzzle, paths, activeLineId) {
  if (isSolved(puzzle, paths)) {
    return {
      paths,
      activeLineId,
      corrected: false,
      complete: true,
    };
  }

  const canonicalPaths = {};
  const commonLengths = {};
  let corrected = false;

  for (const line of puzzle.lines) {
    const path = paths[line.id] ?? [];
    let commonLength = 0;

    while (
      commonLength < path.length &&
      commonLength < line.solution.length &&
      sameCell(path[commonLength], line.solution[commonLength])
    ) {
      commonLength += 1;
    }

    commonLengths[line.id] = commonLength;
    canonicalPaths[line.id] = line.solution
      .slice(0, commonLength)
      .map((cell) => ({ ...cell }));
    corrected ||= commonLength < path.length;
  }

  let hintLine = getLine(puzzle, activeLineId);

  if (!hintLine || commonLengths[hintLine.id] >= hintLine.solution.length) {
    hintLine = puzzle.lines.find(
      (line) => commonLengths[line.id] < line.solution.length,
    );
  }

  if (hintLine) {
    const nextLength = commonLengths[hintLine.id] + 1;
    canonicalPaths[hintLine.id] = hintLine.solution
      .slice(0, nextLength)
      .map((cell) => ({ ...cell }));
  }

  return {
    paths: canonicalPaths,
    activeLineId: hintLine?.id ?? activeLineId,
    corrected,
    complete: isSolved(puzzle, canonicalPaths),
  };
}

export function adjacentCell(cell, direction) {
  const offsets = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  };
  const [rowOffset, colOffset] = offsets[direction] ?? [0, 0];

  return {
    row: cell.row + rowOffset,
    col: cell.col + colOffset,
  };
}
