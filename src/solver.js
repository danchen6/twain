const DEFAULT_NODE_LIMIT = 20_000;
const DEFAULT_SOLUTION_LIMIT = 4;

function numericEdgeKey(first, second) {
  return first < second ? `${first}:${second}` : `${second}:${first}`;
}

function assertAnalysisOptions(nodeLimit, solutionLimit) {
  if (!Number.isInteger(nodeLimit) || nodeLimit < 1) {
    throw new RangeError("Difficulty analysis nodeLimit must be a positive integer.");
  }

  if (!Number.isInteger(solutionLimit) || solutionLimit < 1) {
    throw new RangeError(
      "Difficulty analysis solutionLimit must be a positive integer.",
    );
  }
}

function createGraph(puzzle) {
  if (
    !puzzle ||
    !Number.isInteger(puzzle.rows) ||
    !Number.isInteger(puzzle.cols) ||
    !Array.isArray(puzzle.lines) ||
    !Array.isArray(puzzle.walls)
  ) {
    throw new TypeError("Difficulty analysis requires a puzzle-shaped object.");
  }

  const { rows, cols } = puzzle;
  const cellCount = rows * cols;
  const indexOf = ({ row, col }) => row * cols + col;
  const cellAt = (index) => ({
    row: Math.floor(index / cols),
    col: index % cols,
  });
  const wallEdges = new Set(
    puzzle.walls.map(({ a, b }) =>
      numericEdgeKey(indexOf(a), indexOf(b)),
    ),
  );
  const adjacency = Array.from({ length: cellCount }, (_, index) => {
    const cell = cellAt(index);

    return [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ]
      .filter(
        ({ row, col }) =>
          row >= 0 && row < rows && col >= 0 && col < cols,
      )
      .map(indexOf)
      .filter(
        (neighbor) =>
          !wallEdges.has(numericEdgeKey(index, neighbor)),
      );
  });
  const clueOwner = new Int8Array(cellCount).fill(-1);
  const clueOrder = new Int16Array(cellCount).fill(-1);
  const clueCells = [];
  const clueCounts = [];
  const finals = [];
  const tails = [];
  const nextClues = [];
  let initialMask = 0n;

  puzzle.lines.forEach((line, lineIndex) => {
    clueCells[lineIndex] = [];

    line.clues.forEach((clue, order) => {
      const index = indexOf(clue);
      clueOwner[index] = lineIndex;
      clueOrder[index] = order;
      clueCells[lineIndex][order] = index;
    });

    const start = clueCells[lineIndex][0];
    const final = clueCells[lineIndex].at(-1);
    clueCounts[lineIndex] = line.clues.length;
    finals[lineIndex] = final;
    tails[lineIndex] = start;
    nextClues[lineIndex] = 1;
    initialMask |= 1n << BigInt(start);
  });

  return {
    adjacency,
    cellCount,
    clueCells,
    clueCounts,
    clueOrder,
    clueOwner,
    finals,
    fullMask: (1n << BigInt(cellCount)) - 1n,
    initialMask,
    nextClues,
    tails,
  };
}

function difficultyScore(metrics, solutionLimit) {
  if (!metrics.solved) {
    return Number.MAX_SAFE_INTEGER;
  }

  const effort =
    metrics.firstSolutionNodes +
    metrics.firstSolutionDecisions * 2 +
    metrics.firstSolutionBacktracks * 3;
  const observedSolutionFloor =
    metrics.limitReached || metrics.solutionLimitReached
      ? Math.max(metrics.solutionsFound, solutionLimit)
      : metrics.solutionsFound;
  const abundanceDivisor = Math.sqrt(observedSolutionFloor);

  return Math.max(1, Math.round(effort / abundanceDivisor));
}

export function analyzePuzzleDifficulty(
  puzzle,
  {
    nodeLimit = DEFAULT_NODE_LIMIT,
    solutionLimit = DEFAULT_SOLUTION_LIMIT,
  } = {},
) {
  assertAnalysisOptions(nodeLimit, solutionLimit);

  const graph = createGraph(puzzle);
  const {
    adjacency,
    cellCount,
    clueCells,
    clueCounts,
    clueOrder,
    clueOwner,
    finals,
    fullMask,
    initialMask,
  } = graph;
  const deadStates = new Set();
  const metrics = {
    backtracks: 0,
    decisions: 0,
    forcedMoves: 0,
    firstSolutionBacktracks: null,
    firstSolutionDecisions: null,
    firstSolutionForcedMoves: null,
    firstSolutionNodes: null,
    limitReached: false,
    maxBranching: 0,
    memoHits: 0,
    nodes: 0,
    prunes: 0,
    solutionLimitReached: false,
    solutionsFound: 0,
  };
  const occupied = (mask, index) =>
    (mask & (1n << BigInt(index))) !== 0n;
  const lineIsDone = (tails, nextClues, lineIndex) =>
    tails[lineIndex] === finals[lineIndex] &&
    nextClues[lineIndex] === clueCounts[lineIndex];

  function legalMoves(lineIndex, mask, tails, nextClues) {
    const tail = tails[lineIndex];

    if (lineIsDone(tails, nextClues, lineIndex)) {
      return [];
    }

    return adjacency[tail].filter((candidate) => {
      if (occupied(mask, candidate)) {
        return false;
      }

      const owner = clueOwner[candidate];

      if (owner >= 0 && owner !== lineIndex) {
        return false;
      }

      if (
        owner === lineIndex &&
        clueOrder[candidate] !== nextClues[lineIndex]
      ) {
        return false;
      }

      if (
        puzzle.lines.length === 1 &&
        candidate === finals[lineIndex] &&
        (mask | (1n << BigInt(candidate))) !== fullMask
      ) {
        return false;
      }

      return true;
    });
  }

  function hasComponentAssignment(components, activeLines, moveSets) {
    if (components.length !== activeLines.length || components.length < 2) {
      return true;
    }

    const compatibility = components.map((component) => {
      const clueOwners = new Set(
        component
          .map((cell) => clueOwner[cell])
          .filter((owner) => owner >= 0),
      );

      return activeLines.filter((lineIndex) => {
        if (
          clueOwners.size > 1 ||
          (clueOwners.size === 1 && !clueOwners.has(lineIndex))
        ) {
          return false;
        }

        return component.some((cell) => moveSets[lineIndex].includes(cell));
      });
    });

    if (compatibility.some((lines) => lines.length === 0)) {
      return false;
    }

    if (components.length === 2) {
      return (
        (compatibility[0].includes(activeLines[0]) &&
          compatibility[1].includes(activeLines[1])) ||
        (compatibility[0].includes(activeLines[1]) &&
          compatibility[1].includes(activeLines[0]))
      );
    }

    return true;
  }

  function futureCluesRemainReachable(
    lineIndex,
    mask,
    tails,
    nextClues,
  ) {
    const reachable = new Set([tails[lineIndex]]);
    const queue = [tails[lineIndex]];

    while (queue.length > 0) {
      const current = queue.pop();

      for (const neighbor of adjacency[current]) {
        if (reachable.has(neighbor) || occupied(mask, neighbor)) {
          continue;
        }

        const owner = clueOwner[neighbor];

        if (owner >= 0 && owner !== lineIndex) {
          continue;
        }

        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }

    for (
      let clueIndex = nextClues[lineIndex];
      clueIndex < clueCounts[lineIndex];
      clueIndex += 1
    ) {
      if (!reachable.has(clueCells[lineIndex][clueIndex])) {
        return false;
      }
    }

    return true;
  }

  function canStillCover(mask, tails, nextClues, moveSets) {
    const activeLines = tails
      .map((_, lineIndex) => lineIndex)
      .filter((lineIndex) => !lineIsDone(tails, nextClues, lineIndex));
    const remaining = [];

    for (let index = 0; index < cellCount; index += 1) {
      if (!occupied(mask, index)) {
        remaining.push(index);
      }
    }

    if (remaining.length === 0) {
      return activeLines.length === 0;
    }

    if (activeLines.length === 0) {
      return false;
    }

    const remainingSet = new Set(remaining);
    const seen = new Set();
    const components = [];

    for (const start of remaining) {
      if (seen.has(start)) {
        continue;
      }

      const component = [];
      const queue = [start];
      seen.add(start);

      while (queue.length > 0) {
        const current = queue.pop();
        component.push(current);

        for (const neighbor of adjacency[current]) {
          if (remainingSet.has(neighbor) && !seen.has(neighbor)) {
            seen.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      components.push(component);
    }

    if (components.length > activeLines.length) {
      return false;
    }

    const reachableFromTail = new Set(moveSets.flat());

    if (
      components.some(
        (component) =>
          !component.some((cell) => reachableFromTail.has(cell)),
      ) ||
      !hasComponentAssignment(components, activeLines, moveSets)
    ) {
      return false;
    }

    for (const cell of remaining) {
      const freeNeighbors = adjacency[cell].filter((neighbor) =>
        remainingSet.has(neighbor),
      ).length;
      const tailNeighbors = activeLines.filter((lineIndex) =>
        moveSets[lineIndex].includes(cell),
      ).length;
      const minimumDegree = finals.includes(cell) ? 1 : 2;

      if (freeNeighbors + tailNeighbors < minimumDegree) {
        return false;
      }
    }

    return activeLines.every((lineIndex) =>
      futureCluesRemainReachable(
        lineIndex,
        mask,
        tails,
        nextClues,
      ),
    );
  }

  function orderedMoves(
    moves,
    lineIndex,
    mask,
    nextClues,
  ) {
    return moves
      .map((candidate) => {
        const candidateMask = mask | (1n << BigInt(candidate));
        const isNextClue =
          clueOwner[candidate] === lineIndex &&
          clueOrder[candidate] === nextClues[lineIndex];
        const onward = adjacency[candidate].filter(
          (neighbor) => !occupied(candidateMask, neighbor),
        ).length;

        return { candidate, isNextClue, onward };
      })
      .sort(
        (left, right) =>
          Number(right.isNextClue) - Number(left.isNextClue) ||
          left.onward - right.onward ||
          left.candidate - right.candidate,
      );
  }

  function recordSolution() {
    metrics.solutionsFound += 1;

    if (metrics.firstSolutionNodes === null) {
      metrics.firstSolutionNodes = metrics.nodes;
      metrics.firstSolutionDecisions = metrics.decisions;
      metrics.firstSolutionForcedMoves = metrics.forcedMoves;
      metrics.firstSolutionBacktracks = metrics.backtracks;
    }

    if (metrics.solutionsFound >= solutionLimit) {
      metrics.solutionLimitReached = true;
    }
  }

  function search(mask, tails, nextClues) {
    if (metrics.limitReached || metrics.solutionLimitReached) {
      return { complete: false, solutions: 0 };
    }

    if (metrics.nodes >= nodeLimit) {
      metrics.limitReached = true;
      return { complete: false, solutions: 0 };
    }

    metrics.nodes += 1;

    if (mask === fullMask) {
      const solved = tails.every((_, lineIndex) =>
        lineIsDone(tails, nextClues, lineIndex),
      );

      if (solved) {
        recordSolution();
      }

      return { complete: true, solutions: solved ? 1 : 0 };
    }

    const stateKey = `${mask.toString(36)}:${tails.join(",")}:${nextClues.join(",")}`;

    if (deadStates.has(stateKey)) {
      metrics.memoHits += 1;
      return { complete: true, solutions: 0 };
    }

    const moveSets = tails.map((_, lineIndex) =>
      legalMoves(lineIndex, mask, tails, nextClues),
    );
    const unfinished = tails
      .map((_, lineIndex) => ({
        lineIndex,
        moves: moveSets[lineIndex],
      }))
      .filter(({ lineIndex }) =>
        !lineIsDone(tails, nextClues, lineIndex),
      );

    if (
      unfinished.some(({ moves }) => moves.length === 0) ||
      !canStillCover(mask, tails, nextClues, moveSets)
    ) {
      metrics.prunes += 1;
      deadStates.add(stateKey);
      return { complete: true, solutions: 0 };
    }

    unfinished.sort(
      (left, right) =>
        left.moves.length - right.moves.length ||
        left.lineIndex - right.lineIndex,
    );

    const { lineIndex, moves } = unfinished[0];
    metrics.maxBranching = Math.max(metrics.maxBranching, moves.length);

    if (moves.length === 1) {
      metrics.forcedMoves += 1;
    } else {
      metrics.decisions += 1;
    }

    let complete = true;
    let solutions = 0;

    for (const { candidate } of orderedMoves(
      moves,
      lineIndex,
      mask,
      nextClues,
    )) {
      const nextTails = [...tails];
      const nextStateClues = [...nextClues];
      nextTails[lineIndex] = candidate;

      if (clueOwner[candidate] === lineIndex) {
        nextStateClues[lineIndex] += 1;
      }

      const child = search(
        mask | (1n << BigInt(candidate)),
        nextTails,
        nextStateClues,
      );
      solutions += child.solutions;
      complete &&= child.complete;

      if (child.solutions === 0 && child.complete) {
        metrics.backtracks += 1;
      }

      if (metrics.limitReached || metrics.solutionLimitReached) {
        complete = false;
        break;
      }
    }

    if (complete && solutions === 0) {
      deadStates.add(stateKey);
    }

    return { complete, solutions };
  }

  const startedAt = performance.now();
  const searchResult = search(
    initialMask,
    [...graph.tails],
    [...graph.nextClues],
  );
  const result = {
    ...metrics,
    exhausted:
      searchResult.complete &&
      !metrics.limitReached &&
      !metrics.solutionLimitReached,
    milliseconds: performance.now() - startedAt,
    score: 0,
    solved: metrics.solutionsFound > 0,
  };
  result.score = difficultyScore(result, solutionLimit);

  return result;
}
