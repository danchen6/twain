import {
  DAILY_STORAGE_KEY,
  dailyDifficultyAt,
  dailyStageSeed,
  dailyTwainNumber,
  millisecondsUntilNextTaiwanDay,
  taiwanDateKey,
} from "./daily.js";
import {
  createDailyPlay,
  createDailyStorageRecord,
  restoreDailyPlay,
  storedDailyStageIndex,
} from "./daily-state.js";
import {
  DIFFICULTY_PROFILES,
  cellKey,
  createSeededRandom,
  generatePuzzle,
  manhattanDistance,
  sameCell,
} from "./generator.js";
import {
  adjacentCell,
  applyMove,
  clearPaths,
  clueDisplayValue,
  hintPaths,
  isLineComplete,
  lineDisplayName,
  lineIdAtTarget,
  nextExpectedClue,
  snapshotPlayState,
  totalPathLength,
  undoPlayState,
} from "./game.js";
import { routePaletteForSeed } from "./palette.js";
import { createQrCode } from "./qr.js";
import {
  formatDailyResultShareText,
  formatHintCount,
} from "./share.js";

const boardElement = document.querySelector("#board");
const gameCard = document.querySelector(".game-card");
const dailyTimer = document.querySelector("#dailyTimer");
const timerValue = document.querySelector("#timerValue");
const dailyProgress = document.querySelector("#dailyProgress");
const dailyProgressTrack = document.querySelector("#dailyProgressTrack");
const dailyDate = document.querySelector("#dailyDate");
const clearButton = document.querySelector("#clearButton");
const undoButton = document.querySelector("#undoButton");
const hintButton = document.querySelector("#hintButton");
const liveAnnouncer = document.querySelector("#liveAnnouncer");
const completionOverlay = document.querySelector("#completionOverlay");
const celebrationBurst = document.querySelector(".celebration-burst");
const completionTitle = document.querySelector("#completionTitle");
const completionStats = document.querySelector("#completionStats");
const completionCountdown = document.querySelector("#completionCountdown");
const continueButton = document.querySelector("#continueButton");
const shareResultButton = document.querySelector("#shareResultButton");
const helpButton = document.querySelector("#helpButton");
const shareButton = document.querySelector("#shareButton");
const howToDialog = document.querySelector("#howToDialog");
const closeHowToButton = document.querySelector("#closeHowToButton");
const headerShareDialog = document.querySelector("#headerShareDialog");
const headerShareTitle = document.querySelector("#headerShareTitle");
const headerShareInstructions = document.querySelector(
  "#headerShareInstructions",
);
const headerShareQr = document.querySelector("#headerShareQr");
const headerShareUrl = document.querySelector("#headerShareUrl");
const copyHeaderShareButton = document.querySelector(
  "#copyHeaderShareButton",
);
const closeHeaderShareButton = document.querySelector(
  "#closeHeaderShareButton",
);
const shareFallbackDialog = document.querySelector("#shareFallbackDialog");
const shareFallbackInstructions = document.querySelector(
  "#shareFallbackInstructions",
);
const shareFallbackText = document.querySelector("#shareFallbackText");
const copyShareFallbackButton = document.querySelector(
  "#copyShareFallbackButton",
);
const closeShareFallbackButton = document.querySelector(
  "#closeShareFallbackButton",
);
const shareFeedback = document.querySelector("#shareFeedback");

const MAX_HISTORY = 256;
const CONFETTI_COLORS = [
  "#ffbd38",
  "#ea4e11",
  "#ffb400",
  "#d92f82",
  "var(--route-a-accent)",
  "var(--route-b-accent)",
];
const STAGE_CONFETTI_COUNT = 16;
const DAILY_CONFETTI_WAVES = 3;
const DAILY_CONFETTI_PER_WAVE = 16;
const CONFETTI_WAVE_INTERVAL = 560;

let session = null;
let timerHandle = null;
let activePointerId = null;
let lastPointerCell = null;
let shareFeedbackHandle = null;
let headerShareCopyResetHandle = null;
let shareFallbackCopiedMessage = "Twain share text copied.";

function formatElapsed(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDailyDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
  return label;
}

function formatDailyIdentity(dateKey) {
  const dateLabel = formatDailyDate(dateKey);
  const twainNumber = dailyTwainNumber(dateKey);

  return {
    accessibleLabel:
      twainNumber === null
        ? `Today's puzzle date is ${dateLabel}`
        : `Today's puzzle is Twain number ${twainNumber}, ${dateLabel}`,
    text: twainNumber === null ? dateLabel : `#${twainNumber} | ${dateLabel}`,
  };
}

function canonicalUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}

function canonicalizeLocation() {
  const canonical = canonicalUrl();

  if (canonical !== window.location.href) {
    window.history.replaceState({}, "", canonical);
  }
}

function readStoredDailyPlay() {
  try {
    const stored = window.localStorage.getItem(DAILY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function currentElapsed() {
  if (!session) {
    return 0;
  }

  return (
    session.elapsedMs +
    (session.runningSince === null
      ? 0
      : performance.now() - session.runningSince)
  );
}

function persistDailyPlay() {
  if (!session) {
    return;
  }

  try {
    const stored = createDailyStorageRecord(session, currentElapsed());
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable in private or locked-down browsing contexts.
  }
}

function updateTimer() {
  if (session && taiwanDateKey() !== session.dateKey) {
    initializeDailyRun({
      message: "A new Taiwan day has begun. Today's first board is ready.",
      tone: "neutral",
    });
    return;
  }

  const elapsed = currentElapsed();
  const running = session?.runningSince !== null && !session?.stageCompleted;
  timerValue.textContent = formatElapsed(elapsed);
  dailyTimer.classList.toggle("is-running", Boolean(running));
  dailyTimer.setAttribute(
    "aria-label",
    `Daily elapsed time, ${running ? "running" : "paused"}, ${formatElapsed(elapsed)}`,
  );

  if (session?.dailyComplete) {
    completionCountdown.textContent = `Come back in ${formatCountdown(millisecondsUntilNextTaiwanDay())}`;
  }
}

function startTimerUpdates() {
  if (timerHandle === null) {
    timerHandle = window.setInterval(updateTimer, 250);
  }
}

function startTimer() {
  if (
    !session ||
    session.runningSince !== null ||
    session.stageCompleted ||
    session.dailyComplete
  ) {
    return;
  }

  session.runningSince = performance.now();
  updateTimer();
}

function pauseTimer() {
  if (!session || session.runningSince === null) {
    return;
  }

  session.elapsedMs = currentElapsed();
  session.runningSince = null;
  updateTimer();
}

function createGridLines(puzzle) {
  const lines = [];

  for (let col = 1; col < puzzle.cols; col += 1) {
    lines.push(
      `<line class="grid-line" x1="${col}" y1="0" x2="${col}" y2="${puzzle.rows}" />`,
    );
  }

  for (let row = 1; row < puzzle.rows; row += 1) {
    lines.push(
      `<line class="grid-line" x1="0" y1="${row}" x2="${puzzle.cols}" y2="${row}" />`,
    );
  }

  return lines.join("");
}

function createWallLines(puzzle) {
  return puzzle.walls
    .map(({ a, b }) => {
      if (a.row === b.row) {
        const x = Math.max(a.col, b.col);
        return `<line class="wall-line" x1="${x}" y1="${a.row}" x2="${x}" y2="${a.row + 1}" />`;
      }

      const y = Math.max(a.row, b.row);
      return `<line class="wall-line" x1="${a.col}" y1="${y}" x2="${a.col + 1}" y2="${y}" />`;
    })
    .join("");
}

function createRouteDefinitions(puzzle, palette) {
  return puzzle.lines
    .map((line) => {
      const [start, middle, end] = palette[line.id].stops;
      return `
        <linearGradient
          id="routeGradient-${line.id}"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="${puzzle.rows}"
          x2="${puzzle.cols}"
          y2="0"
        >
          <stop offset="0" stop-color="${start}" />
          <stop offset="0.52" stop-color="${middle}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      `;
    })
    .join("");
}

function createRouteElements(puzzle, palette) {
  return puzzle.lines
    .map(
      (line) => `
        <circle
          class="route-start line-${line.id}"
          data-route-start="${line.id}"
          fill="${palette[line.id].stops[0]}"
          r="0.29"
          style="display:none"
        />
        <polyline
          class="route-underlay"
          data-route-underlay="${line.id}"
          points=""
          style="display:none"
        />
        <polyline
          class="route-line line-${line.id}"
          data-route-line="${line.id}"
          points=""
          stroke="url(#routeGradient-${line.id})"
          style="display:none"
        />
      `,
    )
    .join("");
}

function createBoardSvg(puzzle, palette) {
  const outlineInset = 0.025;

  return `
    <svg
      class="board-svg"
      viewBox="0 0 ${puzzle.cols} ${puzzle.rows}"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>${createRouteDefinitions(puzzle, palette)}</defs>
      <rect width="${puzzle.cols}" height="${puzzle.rows}" fill="#fffdfa" />
      <g>
        ${createGridLines(puzzle)}
        ${createRouteElements(puzzle, palette)}
        ${createWallLines(puzzle)}
      </g>
      <rect
        class="board-outline"
        x="${outlineInset}"
        y="${outlineInset}"
        width="${puzzle.cols - outlineInset * 2}"
        height="${puzzle.rows - outlineInset * 2}"
      />
    </svg>
  `;
}

function createClueLayer(puzzle) {
  const clues = puzzle.lines
    .flatMap((line) =>
      line.clues.map((clue) => {
        const displayValue = clueDisplayValue(line.id, clue.value);
        const glyphCount = [...displayValue].length;
        const sizingClass = glyphCount > 1 ? " is-wide" : "";

        return `
          <div
            class="clue-slot line-${line.id}"
            data-line-id="${line.id}"
            data-clue-value="${clue.value}"
            style="grid-row:${clue.row + 1};grid-column:${clue.col + 1}"
          >
            <span class="clue-disc${sizingClass}" data-glyph-count="${glyphCount}">
              <span class="clue-value">${displayValue}</span>
            </span>
          </div>
        `;
      }),
    )
    .join("");

  return `<div class="clue-layer" aria-hidden="true">${clues}</div>`;
}

function createHitLayer(puzzle) {
  const clueByCell = new Map();

  for (const line of puzzle.lines) {
    for (const clue of line.clues) {
      clueByCell.set(cellKey(clue), { lineId: line.id, value: clue.value });
    }
  }

  const cells = [];

  for (let row = 0; row < puzzle.rows; row += 1) {
    for (let col = 0; col < puzzle.cols; col += 1) {
      const clue = clueByCell.get(cellKey({ row, col }));
      const clueDescription = clue
        ? `, ${lineDisplayName(clue.lineId)} clue ${clueDisplayValue(clue.lineId, clue.value)}`
        : "";
      cells.push(`
        <div
          class="cell-hit"
          role="gridcell"
          aria-label="Row ${row + 1}, column ${col + 1}${clueDescription}"
          aria-rowindex="${row + 1}"
          aria-colindex="${col + 1}"
          data-row="${row}"
          data-col="${col}"
        ></div>
      `);
    }
  }

  return `
    <div
      class="hit-layer"
      role="grid"
      aria-rowcount="${puzzle.rows}"
      aria-colcount="${puzzle.cols}"
    >
      ${cells.join("")}
    </div>
  `;
}

function updateDailyDate() {
  const identity = formatDailyIdentity(session.dateKey);
  dailyDate.textContent = identity.text;
  dailyDate.setAttribute("aria-label", identity.accessibleLabel);
}

function renderPuzzle() {
  const { palette, puzzle, schedule, stageIndex } = session;
  const profile = DIFFICULTY_PROFILES[puzzle.difficulty];
  gameCard.dataset.routePalette = palette.id;
  document.documentElement.style.setProperty("--route-a-accent", palette.a.accent);
  document.documentElement.style.setProperty("--route-b-accent", palette.b.accent);
  boardElement.style.setProperty("--rows", puzzle.rows);
  boardElement.style.setProperty("--cols", puzzle.cols);
  boardElement.dataset.difficulty = puzzle.difficulty;
  boardElement.dataset.routePalette = palette.id;
  boardElement.innerHTML = [
    createBoardSvg(puzzle, palette),
    createClueLayer(puzzle),
    createHitLayer(puzzle),
  ].join("");
  boardElement.setAttribute(
    "aria-label",
    `${profile.label} daily Twain puzzle, stage ${stageIndex + 1} of ${schedule.length}, ${puzzle.rows} by ${puzzle.cols}`,
  );
}

function remainingCellCopy(remaining) {
  return `${remaining} ${remaining === 1 ? "cell" : "cells"} left.`;
}

function defaultStatus() {
  const { puzzle, paths, activeLineId } = session;
  const profile = DIFFICULTY_PROFILES[puzzle.difficulty];

  if (session.dailyComplete) {
    return {
      message: `Today's ${session.schedule.length}-board Twain run is complete in ${formatElapsed(currentElapsed())}.`,
      tone: "success",
    };
  }

  if (session.stageCompleted) {
    return {
      message: `${profile.label} complete. The daily timer is paused until the next stage begins.`,
      tone: "success",
    };
  }

  const occupiedCells = totalPathLength(paths);
  const remaining = puzzle.rows * puzzle.cols - occupiedCells;

  if (occupiedCells === 0) {
    return {
      message:
        session.stageIndex === 0 && session.elapsedMs === 0
          ? "Start at 1 or A. The daily timer begins with your first valid move."
          : `${profile.label} is ready. The daily timer resumes with your first valid move.`,
      tone: "neutral",
    };
  }

  const activeLine = puzzle.lines.find((line) => line.id === activeLineId);
  const expected = nextExpectedClue(puzzle, paths, activeLineId);

  if (isLineComplete(puzzle, paths, activeLineId)) {
    const nextLine = puzzle.lines.find(
      (line) => !isLineComplete(puzzle, paths, line.id),
    );
    return {
      message: `${lineDisplayName(activeLineId)} complete.${
        nextLine ? ` Continue with ${lineDisplayName(nextLine.id)}.` : ""
      } ${remainingCellCopy(remaining)}`,
      tone: "neutral",
    };
  }

  const nextPart =
    expected <= activeLine.clues.length
      ? `${lineDisplayName(activeLineId)}: next ${clueDisplayValue(activeLineId, expected)}.`
      : `${lineDisplayName(activeLineId)} has reached its final clue.`;

  return {
    message: `${nextPart} ${remainingCellCopy(remaining)}`,
    tone: "neutral",
  };
}

function updateRoute(lineId, path) {
  const points = path
    .map((cell) => `${cell.col + 0.5},${cell.row + 0.5}`)
    .join(" ");
  const routeLine = boardElement.querySelector(`[data-route-line="${lineId}"]`);
  const routeUnderlay = boardElement.querySelector(
    `[data-route-underlay="${lineId}"]`,
  );
  const routeStart = boardElement.querySelector(
    `[data-route-start="${lineId}"]`,
  );

  for (const route of [routeLine, routeUnderlay]) {
    route.setAttribute("points", points);
    route.style.display = path.length === 0 ? "none" : "";
  }

  if (path.length > 0) {
    routeStart.setAttribute("cx", path[0].col + 0.5);
    routeStart.setAttribute("cy", path[0].row + 0.5);
    routeStart.style.display = "";
  } else {
    routeStart.style.display = "none";
  }
}

function renderDailyProgress() {
  const profile = DIFFICULTY_PROFILES[session.puzzle.difficulty];
  const totalStages = session.schedule.length;
  const completedStages =
    session.stageIndex + (session.stageCompleted ? 1 : 0);

  dailyProgress.setAttribute("aria-valuemax", String(totalStages));
  dailyProgress.setAttribute("aria-valuenow", String(completedStages));
  dailyProgress.setAttribute(
    "aria-valuetext",
    session.dailyComplete
      ? `All ${totalStages} daily stages complete`
      : session.stageCompleted
        ? `${completedStages} of ${totalStages} stages complete; next level ready`
      : `${completedStages} complete; ${profile.label}, stage ${session.stageIndex + 1} of ${totalStages}`,
  );

  const scheduleSignature = session.schedule.join(",");

  if (dailyProgressTrack.dataset.schedule !== scheduleSignature) {
    const steps = session.schedule.map((difficulty, index) => {
      const step = document.createElement("span");
      step.dataset.dailyStep = String(index);
      step.title = DIFFICULTY_PROFILES[difficulty].label;
      return step;
    });
    dailyProgressTrack.replaceChildren(...steps);
    dailyProgressTrack.dataset.schedule = scheduleSignature;
    dailyProgressTrack.style.setProperty(
      "--daily-stage-count",
      String(totalStages),
    );
  }

  dailyProgressTrack
    .querySelectorAll("[data-daily-step]")
    .forEach((step, index) => {
      const complete =
        index < session.stageIndex ||
        (index === session.stageIndex && session.stageCompleted);
      step.classList.toggle("is-complete", complete);
      step.classList.toggle(
        "is-current",
        index === session.stageIndex && !session.stageCompleted,
      );
    });
}

function randomBetween(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function perimeterOrigin(sector, random) {
  switch (sector) {
    case 0:
      return { x: randomBetween(random, 18, 82), y: 0 };
    case 1:
      return random() < 0.5
        ? { x: 100, y: randomBetween(random, 0, 18) }
        : { x: randomBetween(random, 82, 100), y: 0 };
    case 2:
      return { x: 100, y: randomBetween(random, 18, 82) };
    case 3:
      return random() < 0.5
        ? { x: 100, y: randomBetween(random, 82, 100) }
        : { x: randomBetween(random, 82, 100), y: 100 };
    case 4:
      return { x: randomBetween(random, 18, 82), y: 100 };
    case 5:
      return random() < 0.5
        ? { x: 0, y: randomBetween(random, 82, 100) }
        : { x: randomBetween(random, 0, 18), y: 100 };
    case 6:
      return { x: 0, y: randomBetween(random, 18, 82) };
    default:
      return random() < 0.5
        ? { x: 0, y: randomBetween(random, 0, 18) }
        : { x: randomBetween(random, 0, 18), y: 0 };
  }
}

function setConfettiShape(piece, shape, random) {
  if (shape === 1) {
    piece.dataset.confettiShape = "dot";
    const size = randomBetween(random, 11, 16);
    piece.style.width = `${size.toFixed(1)}px`;
    piece.style.height = `${size.toFixed(1)}px`;
    piece.style.borderRadius = "50%";
    return;
  }

  if (shape === 2) {
    piece.dataset.confettiShape = "short";
    piece.style.width = `${randomBetween(random, 16, 22).toFixed(1)}px`;
    piece.style.height = `${randomBetween(random, 7, 10).toFixed(1)}px`;
    piece.style.borderRadius = "3px";
    return;
  }

  const width = randomBetween(random, 8, 11);
  piece.dataset.confettiShape = "strip";
  piece.style.width = `${width.toFixed(1)}px`;
  piece.style.height = `${randomBetween(random, 22, 30).toFixed(1)}px`;
  piece.style.borderRadius = `${(width / 2).toFixed(1)}px`;
}

function createConfettiPiece({
  boardSize,
  index,
  random,
  wave,
}) {
  const piece = document.createElement("span");
  const sector = (index + wave * 3) % 8;
  const origin = perimeterOrigin(sector, random);
  const originX = (origin.x / 100) * boardSize;
  const originY = (origin.y / 100) * boardSize;
  const angle =
    Math.atan2(boardSize / 2 - originY, boardSize / 2 - originX) +
    randomBetween(random, -0.36, 0.36);
  const minimumTravel = Math.min(110, boardSize * 0.29);
  const maximumTravel = Math.min(180, boardSize * 0.45);
  const travel = randomBetween(random, minimumTravel, maximumTravel);
  const gravity = randomBetween(
    random,
    Math.min(105, boardSize * 0.3),
    Math.min(185, boardSize * 0.48),
  );
  const lift = gravity * randomBetween(random, 0.72, 0.96);
  const launchX = Math.cos(angle) * travel;
  const launchY = Math.sin(angle) * travel - lift;
  const horizontalDrift = randomBetween(
    random,
    -Math.min(30, boardSize * 0.075),
    Math.min(30, boardSize * 0.075),
  );
  const spin =
    (random() < 0.5 ? -1 : 1) * randomBetween(random, 0.85, 1.65);
  const startingRotation = randomBetween(random, -50, 50);
  const delay =
    60 + wave * CONFETTI_WAVE_INTERVAL + randomBetween(random, 0, 80);

  piece.dataset.confettiWave = String(wave);
  piece.dataset.confettiSector = String(sector);
  piece.style.setProperty("--origin-x", `${origin.x.toFixed(2)}%`);
  piece.style.setProperty("--origin-y", `${origin.y.toFixed(2)}%`);

  for (const [label, progress] of [
    ["25", 0.25],
    ["50", 0.5],
    ["75", 0.75],
    ["100", 1],
  ]) {
    const x =
      launchX * progress + horizontalDrift * Math.sin(Math.PI * progress);
    const y = launchY * progress + gravity * progress * progress;
    piece.style.setProperty(`--cheer-${label}-x`, `${x.toFixed(1)}px`);
    piece.style.setProperty(`--cheer-${label}-y`, `${y.toFixed(1)}px`);
    piece.style.setProperty(
      `--rotation-${label}`,
      `${(startingRotation + spin * 360 * progress).toFixed(1)}deg`,
    );
  }

  piece.style.animationDelay = `${delay.toFixed(0)}ms`;
  piece.style.animationDuration = `${randomBetween(random, 420, 560).toFixed(0)}ms`;
  piece.style.animationIterationCount = "1";
  piece.style.background =
    CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)];
  setConfettiShape(piece, (index + wave) % 3, random);
  return piece;
}

function renderCelebration(dailyComplete) {
  const boardSize = Math.max(
    240,
    Math.round(boardElement.getBoundingClientRect().width),
  );
  const mode = dailyComplete ? "daily" : "stage";
  const signature = `${mode}:${session.dateKey}:${session.stageIndex}:${boardSize}`;

  if (celebrationBurst.dataset.signature === signature) {
    return;
  }

  const random = createSeededRandom(`twain-confetti:v3:${signature}`);
  const waveCount = dailyComplete ? DAILY_CONFETTI_WAVES : 1;
  const particlesPerWave = dailyComplete
    ? DAILY_CONFETTI_PER_WAVE
    : STAGE_CONFETTI_COUNT;
  const pieces = [];

  for (let wave = 0; wave < waveCount; wave += 1) {
    for (let index = 0; index < particlesPerWave; index += 1) {
      pieces.push(
        createConfettiPiece({
          boardSize,
          index,
          random,
          wave,
        }),
      );
    }
  }

  celebrationBurst.replaceChildren(...pieces);
  celebrationBurst.dataset.signature = signature;
}

function renderCompletion() {
  completionOverlay.hidden = !session.stageCompleted;
  completionOverlay.classList.toggle(
    "is-daily-complete",
    session.stageCompleted && session.dailyComplete,
  );

  if (!session.stageCompleted) {
    return;
  }

  renderCelebration(session.dailyComplete);

  const hintLabel = formatHintCount(session.hints);
  completionCountdown.hidden = !session.dailyComplete;
  continueButton.hidden = session.dailyComplete;
  shareResultButton.hidden = !session.dailyComplete;

  if (session.dailyComplete) {
    completionTitle.textContent = "Well played!";
    completionStats.textContent = `Completed in ${formatElapsed(currentElapsed())} · ${hintLabel}`;
    completionCountdown.textContent = `Come back in ${formatCountdown(millisecondsUntilNextTaiwanDay())}`;
    return;
  }

  completionTitle.textContent = "Nicely done!";
  completionStats.textContent = hintLabel;
  continueButton.textContent = "Next level";
}

function renderState(feedback = null) {
  const { puzzle, paths, activeLineId } = session;
  const occupiedCells = totalPathLength(paths);
  const allPathKeys = new Map();

  for (const line of puzzle.lines) {
    for (const cell of paths[line.id]) {
      allPathKeys.set(cellKey(cell), line.id);
    }

    updateRoute(line.id, paths[line.id]);
  }

  boardElement.dataset.activeLine = activeLineId;
  boardElement.querySelectorAll(".clue-slot").forEach((slot) => {
    const lineId = slot.dataset.lineId;
    const line = puzzle.lines.find((candidate) => candidate.id === lineId);
    const clue = line.clues[Number(slot.dataset.clueValue) - 1];
    const path = paths[lineId];
    const tail = path.at(-1);
    const visited = path.some((cell) => sameCell(cell, clue));

    slot.classList.toggle("visited", visited);
    slot.classList.toggle("current", sameCell(tail, clue));
    slot.classList.toggle("active-line", activeLineId === lineId);
  });

  boardElement.querySelectorAll(".cell-hit").forEach((hit) => {
    const cell = {
      row: Number(hit.dataset.row),
      col: Number(hit.dataset.col),
    };
    const occupyingLine = allPathKeys.get(cellKey(cell));
    const activeTail = paths[activeLineId].at(-1);

    hit.setAttribute("aria-selected", String(Boolean(occupyingLine)));

    if (occupyingLine) {
      hit.dataset.occupiedLine = occupyingLine;
    } else {
      delete hit.dataset.occupiedLine;
    }

    if (sameCell(activeTail, cell)) {
      hit.setAttribute("aria-current", "step");
    } else {
      hit.removeAttribute("aria-current");
    }
  });

  const announcedFeedback = feedback ?? defaultStatus();
  liveAnnouncer.textContent = announcedFeedback.message;
  boardElement.classList.toggle("is-complete", session.stageCompleted);
  boardElement.setAttribute("aria-disabled", String(session.stageCompleted));
  clearButton.disabled = occupiedCells === 0 || session.stageCompleted;
  undoButton.disabled = session.history.length === 0 || session.stageCompleted;
  hintButton.disabled = session.stageCompleted;
  renderDailyProgress();
  renderCompletion();
  updateTimer();
}

function puzzleForStage(dateKey, stageIndex) {
  const difficulty = dailyDifficultyAt(dateKey, stageIndex);
  return generatePuzzle(difficulty, {
    seed: dailyStageSeed(dateKey, difficulty),
  });
}

function initializeDailyRun(feedback = null) {
  const dateKey = taiwanDateKey();
  const stored = readStoredDailyPlay();
  const storedStage = storedDailyStageIndex(stored, dateKey);
  let puzzle = puzzleForStage(dateKey, storedStage ?? 0);
  let play =
    storedStage === null
      ? null
      : restoreDailyPlay(stored, dateKey, puzzle);

  if (!play) {
    if (storedStage !== null && storedStage !== 0) {
      puzzle = puzzleForStage(dateKey, 0);
    }

    play = createDailyPlay(dateKey, puzzle, 0);
  }

  session = {
    ...play,
    puzzle,
    palette: routePaletteForSeed(puzzle.seed),
    runningSince: null,
  };
  activePointerId = null;
  lastPointerCell = null;

  canonicalizeLocation();
  updateDailyDate();
  renderPuzzle();
  renderState(feedback);
  persistDailyPlay();
  startTimerUpdates();
}

function rememberPlayState() {
  session.history.push(
    snapshotPlayState(session.paths, session.activeLineId),
  );

  if (session.history.length > MAX_HISTORY) {
    session.history.shift();
  }
}

function chooseNextIncompleteLine() {
  return session.puzzle.lines.find(
    (line) => !isLineComplete(session.puzzle, session.paths, line.id),
  )?.id;
}

function finishStage() {
  pauseTimer();
  session.stageCompleted = true;
  session.dailyComplete =
    session.stageIndex === session.schedule.length - 1;
  renderState();
  persistDailyPlay();
}

function acceptCell(target) {
  if (session.stageCompleted) {
    return false;
  }

  const result = applyMove(
    session.puzzle,
    session.paths,
    session.activeLineId,
    target,
  );

  if (!result.accepted) {
    if (!result.quiet) {
      session.mistakes += 1;
      renderState({ message: result.message, tone: "error" });
      persistDailyPlay();
    }

    return false;
  }

  rememberPlayState();
  startTimer();
  session.paths = result.paths;
  session.activeLineId = result.activeLineId;

  if (result.complete) {
    finishStage();
  } else if (result.kind === "line-complete") {
    session.activeLineId = chooseNextIncompleteLine() ?? session.activeLineId;
    renderState({ message: result.message, tone: "neutral" });
    persistDailyPlay();
  } else {
    renderState();
    persistDailyPlay();
  }

  return true;
}

function cellFromHit(hit) {
  if (!hit) {
    return null;
  }

  return {
    row: Number(hit.dataset.row),
    col: Number(hit.dataset.col),
  };
}

function hitAtPointer(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const hit = element?.closest?.(".cell-hit");
  return hit && boardElement.contains(hit) ? hit : null;
}

function selectLine(lineId, { announce = false } = {}) {
  if (
    session.stageCompleted ||
    !session.puzzle.lines.some((line) => line.id === lineId)
  ) {
    return false;
  }

  session.activeLineId = lineId;
  renderState(
    announce
      ? {
          message: `${lineDisplayName(lineId)} selected.`,
          tone: "neutral",
        }
      : null,
  );
  persistDailyPlay();
  return true;
}

function selectLineForPointerStart(target) {
  const targetLineId = lineIdAtTarget(session.puzzle, session.paths, target);

  if (targetLineId && targetLineId !== session.activeLineId) {
    session.activeLineId = targetLineId;
    renderState();
    persistDailyPlay();
  }
}

function dragToCell(target) {
  const path = session.paths[session.activeLineId];

  if (path.length === 0) {
    acceptCell(target);
    return;
  }

  const existing = path.some((cell) => sameCell(cell, target));

  if (existing) {
    acceptCell(target);
    return;
  }

  let tail = path.at(-1);

  if (manhattanDistance(tail, target) <= 1) {
    acceptCell(target);
    return;
  }

  const sameRow = tail.row === target.row;
  const sameColumn = tail.col === target.col;

  if (!sameRow && !sameColumn) {
    return;
  }

  const rowStep = Math.sign(target.row - tail.row);
  const colStep = Math.sign(target.col - tail.col);

  while (!sameCell(tail, target) && !session.stageCompleted) {
    const next = {
      row: tail.row + rowStep,
      col: tail.col + colStep,
    };

    if (!acceptCell(next)) {
      break;
    }

    tail = session.paths[session.activeLineId].at(-1);

    if (!tail) {
      break;
    }
  }
}

function clearCurrentPuzzle() {
  if (session.stageCompleted || totalPathLength(session.paths) === 0) {
    return;
  }

  session.paths = clearPaths(session.puzzle);
  session.activeLineId = session.puzzle.lines[0].id;
  session.history = [];
  renderState({
    message: `Board cleared. The daily timer ${
      session.runningSince === null ? "will resume with your next move" : "continues"
    }; start again at 1 or A.`,
    tone: "neutral",
  });
  persistDailyPlay();
  boardElement.focus({ preventScroll: true });
}

function undo() {
  if (session.stageCompleted || session.history.length === 0) {
    return;
  }

  const undone = undoPlayState(
    session.history,
    snapshotPlayState(session.paths, session.activeLineId),
  );
  session.history = undone.history;
  session.paths = undone.state.paths;
  session.activeLineId = undone.state.activeLineId;
  renderState({ message: "One step undone.", tone: "neutral" });
  persistDailyPlay();
  boardElement.focus({ preventScroll: true });
}

function showHint() {
  if (session.stageCompleted) {
    return;
  }

  rememberPlayState();
  startTimer();
  const hint = hintPaths(
    session.puzzle,
    session.paths,
    session.activeLineId,
  );
  session.paths = hint.paths;
  session.activeLineId = hint.activeLineId;
  session.hints += 1;

  if (hint.complete) {
    finishStage();
  } else {
    renderState({
      message: hint.corrected
        ? "Conflicting detours were cleared; one correct step was added."
        : `One correct step added to ${lineDisplayName(session.activeLineId)}.`,
      tone: "neutral",
    });
    persistDailyPlay();
  }

  boardElement.focus({ preventScroll: true });
}

function continueDailyRun() {
  if (session.dailyComplete || !session.stageCompleted) {
    return;
  }

  pauseTimer();
  const nextStageIndex = session.stageIndex + 1;
  const puzzle = puzzleForStage(session.dateKey, nextStageIndex);
  const nextPlay = createDailyPlay(session.dateKey, puzzle, nextStageIndex);
  session = {
    ...nextPlay,
    elapsedMs: session.elapsedMs,
    hints: session.hints,
    mistakes: session.mistakes,
    puzzle,
    palette: routePaletteForSeed(puzzle.seed),
    runningSince: null,
  };

  updateDailyDate();
  renderPuzzle();
  renderState({
    message: `${DIFFICULTY_PROFILES[puzzle.difficulty].label} is ready. The daily timer resumes with your first valid move.`,
    tone: "neutral",
  });
  persistDailyPlay();
  boardElement.focus({ preventScroll: true });
}

function showShareFeedback(message) {
  window.clearTimeout(shareFeedbackHandle);
  shareFeedback.textContent = message;
  shareFeedback.hidden = false;
  shareFeedbackHandle = window.setTimeout(() => {
    shareFeedback.hidden = true;
  }, 2400);
}

function legacyCopyText(text) {
  if (typeof document.execCommand !== "function") {
    return false;
  }

  const previousFocus = document.activeElement;
  const copySource = document.createElement("textarea");
  copySource.className = "legacy-copy-source";
  copySource.value = text;
  copySource.readOnly = true;
  copySource.tabIndex = -1;
  copySource.setAttribute("aria-hidden", "true");
  document.body.append(copySource);
  copySource.focus();
  copySource.select();
  copySource.setSelectionRange(0, copySource.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  copySource.remove();
  previousFocus?.focus?.({ preventScroll: true });
  return copied;
}

function selectShareFallbackText() {
  shareFallbackText.focus({ preventScroll: true });
  shareFallbackText.select();
  shareFallbackText.setSelectionRange(0, shareFallbackText.value.length);
}

function openShareFallback(text, copiedMessage) {
  shareFallbackText.value = text;
  shareFallbackCopiedMessage = copiedMessage;
  shareFallbackInstructions.textContent =
    "Native sharing is unavailable here. Copy this instead.";

  if (!shareFallbackDialog.open) {
    shareFallbackDialog.showModal();
  }

  window.requestAnimationFrame(selectShareFallbackText);
}

function closeShareFallback() {
  shareFallbackDialog.close();
}

function selectHeaderShareUrl() {
  headerShareUrl.focus({ preventScroll: true });
  headerShareUrl.select();
  headerShareUrl.setSelectionRange(0, headerShareUrl.value.length);
}

function renderHeaderShareQr(url) {
  const qrCode = createQrCode(url);
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  const background = document.createElementNS(namespace, "rect");
  const modules = document.createElementNS(namespace, "path");

  svg.setAttribute(
    "viewBox",
    `0 0 ${qrCode.viewBoxSize} ${qrCode.viewBoxSize}`,
  );
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("shape-rendering", "crispEdges");
  background.setAttribute("width", String(qrCode.viewBoxSize));
  background.setAttribute("height", String(qrCode.viewBoxSize));
  background.setAttribute("fill", "#fff");
  modules.setAttribute("d", qrCode.pathData);
  modules.setAttribute("fill", "#000");
  svg.append(background, modules);

  headerShareQr.hidden = false;
  headerShareQr.dataset.moduleCount = String(qrCode.moduleCount);
  headerShareQr.dataset.value = url;
  headerShareQr.replaceChildren(svg);
}

function openHeaderShare() {
  const url = canonicalUrl();
  const dateKey = session?.dateKey ?? taiwanDateKey();
  const twainNumber = dailyTwainNumber(dateKey);

  headerShareTitle.textContent =
    twainNumber === null ? "Share Twain" : `Share Twain #${twainNumber}`;
  headerShareInstructions.textContent =
    "Scan to play on another device, or copy the link.";
  window.clearTimeout(headerShareCopyResetHandle);
  copyHeaderShareButton.textContent = "Copy link";
  headerShareUrl.value = url;

  try {
    renderHeaderShareQr(url);
  } catch {
    headerShareQr.hidden = true;
    headerShareQr.replaceChildren();
    headerShareInstructions.textContent =
      "The QR code is unavailable here. Copy the link instead.";
  }

  if (!headerShareDialog.open) {
    headerShareDialog.showModal();
  }
}

function closeHeaderShare() {
  headerShareDialog.close();
}

function copyText(
  text,
  copiedMessage,
  onFailure,
  onCopied = () => {},
  showToast = true,
) {
  const copied = () => {
    liveAnnouncer.textContent = copiedMessage;
    if (showToast) {
      showShareFeedback(copiedMessage);
    }
    onCopied();
  };
  const failed = () => {
    if (legacyCopyText(text)) {
      copied();
      return;
    }
    onFailure();
  };

  if (
    window.isSecureContext &&
    typeof navigator.clipboard?.writeText === "function"
  ) {
    let clipboardResult;
    try {
      clipboardResult = navigator.clipboard.writeText(text);
    } catch {
      failed();
      return;
    }

    if (clipboardResult && typeof clipboardResult.then === "function") {
      Promise.resolve(clipboardResult).then(copied, failed);
      return;
    }
  }

  failed();
}

function nativeShareAvailable(shareData) {
  if (!window.isSecureContext || typeof navigator.share !== "function") {
    return false;
  }

  if (typeof navigator.canShare !== "function") {
    return true;
  }

  try {
    return navigator.canShare(shareData);
  } catch {
    return false;
  }
}

function shareWithFallback({ title, text, clipboardText, copiedMessage }) {
  const url = canonicalUrl();
  const shareData = { url };

  if (title) {
    shareData.title = title;
  }

  if (text) {
    shareData.text = text;
  }

  const fallbackText = clipboardText ?? url;

  if (nativeShareAvailable(shareData)) {
    let shareResult;
    try {
      shareResult = navigator.share(shareData);
    } catch {
      openShareFallback(fallbackText, copiedMessage);
      return;
    }

    if (!shareResult || typeof shareResult.then !== "function") {
      openShareFallback(fallbackText, copiedMessage);
      return;
    }

    Promise.resolve(shareResult).catch((error) => {
      if (error?.name !== "AbortError") {
        openShareFallback(fallbackText, copiedMessage);
      }
    });
    return;
  }

  copyText(fallbackText, copiedMessage, () => {
    openShareFallback(fallbackText, copiedMessage);
  });
}

function copyHeaderShareUrl() {
  copyText(
    headerShareUrl.value,
    "Today's Twain link copied.",
    () => {
      headerShareInstructions.textContent =
        "Automatic copying is unavailable. Select the link and copy it manually.";
      liveAnnouncer.textContent =
        "Automatic copying is unavailable. The Twain link is selected for manual copying.";
      selectHeaderShareUrl();
    },
    () => {
      window.clearTimeout(headerShareCopyResetHandle);
      copyHeaderShareButton.textContent = "Copied";
      headerShareCopyResetHandle = window.setTimeout(() => {
        copyHeaderShareButton.textContent = "Copy link";
      }, 2400);
    },
    false,
  );
}

function shareDailyResult() {
  if (!session?.dailyComplete) {
    return;
  }

  const twainNumber = dailyTwainNumber(session.dateKey);
  const resultText = formatDailyResultShareText({
    elapsed: formatElapsed(currentElapsed()),
    hints: session.hints,
    twainNumber,
  });
  shareWithFallback({
    title: "Twain",
    text: resultText,
    clipboardText: `${resultText} ${canonicalUrl()}`,
    copiedMessage: "Your Twain result was copied.",
  });
}

function copyShareFallback() {
  copyText(
    shareFallbackText.value,
    shareFallbackCopiedMessage,
    () => {
      shareFallbackInstructions.textContent =
        "Select the text and copy it manually.";
      liveAnnouncer.textContent =
        "Automatic copying is unavailable. The share text is selected for manual copying.";
      selectShareFallbackText();
    },
    closeShareFallback,
  );
}

function openHowTo() {
  howToDialog.showModal();
}

function closeHowTo() {
  howToDialog.close();
}

boardElement.addEventListener("pointerdown", (event) => {
  if (
    session.stageCompleted ||
    (event.button !== 0 && event.pointerType === "mouse")
  ) {
    return;
  }

  const hit = event.target.closest(".cell-hit");

  if (!hit) {
    return;
  }

  event.preventDefault();
  boardElement.focus({ preventScroll: true });
  activePointerId = event.pointerId;
  lastPointerCell = cellFromHit(hit);
  selectLineForPointerStart(lastPointerCell);
  boardElement.setPointerCapture?.(event.pointerId);
  const startedOnPath = Object.values(session.paths).some((path) =>
    path.some((cell) => sameCell(cell, lastPointerCell)),
  );

  if (!startedOnPath) {
    acceptCell(lastPointerCell);
  }
});

boardElement.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  const cell = cellFromHit(hitAtPointer(event));

  if (!cell || sameCell(cell, lastPointerCell)) {
    return;
  }

  lastPointerCell = cell;
  dragToCell(cell);
});

function releasePointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  if (boardElement.hasPointerCapture?.(event.pointerId)) {
    boardElement.releasePointerCapture(event.pointerId);
  }

  activePointerId = null;
  lastPointerCell = null;
}

boardElement.addEventListener("pointerup", releasePointer);
boardElement.addEventListener("pointercancel", releasePointer);

boardElement.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const key = event.key.toLowerCase();
  const directions = {
    arrowup: "up",
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
  };

  if (directions[key]) {
    event.preventDefault();
    const path = session.paths[session.activeLineId];

    if (path.length === 0) {
      const activeLine = session.puzzle.lines.find(
        (line) => line.id === session.activeLineId,
      );
      acceptCell(activeLine.clues[0]);
      return;
    }

    acceptCell(adjacentCell(path.at(-1), directions[key]));
    return;
  }

  if (key === "n" || key === "l") {
    event.preventDefault();
    selectLine(key === "n" ? "a" : "b", { announce: true });
  } else if (
    (key === "enter" || key === " ") &&
    session.paths[session.activeLineId].length === 0
  ) {
    event.preventDefault();
    const activeLine = session.puzzle.lines.find(
      (line) => line.id === session.activeLineId,
    );
    acceptCell(activeLine.clues[0]);
  } else if (key === "backspace") {
    event.preventDefault();
    undo();
  } else if (key === "h") {
    event.preventDefault();
    showHint();
  } else if (key === "r") {
    event.preventDefault();
    clearCurrentPuzzle();
  }
});

clearButton.addEventListener("click", clearCurrentPuzzle);
undoButton.addEventListener("click", undo);
hintButton.addEventListener("click", showHint);
continueButton.addEventListener("click", continueDailyRun);
helpButton.addEventListener("click", openHowTo);
shareButton.addEventListener("click", openHeaderShare);
shareResultButton.addEventListener("click", shareDailyResult);
closeHowToButton.addEventListener("click", closeHowTo);
copyHeaderShareButton.addEventListener("click", copyHeaderShareUrl);
closeHeaderShareButton.addEventListener("click", closeHeaderShare);
copyShareFallbackButton.addEventListener("click", copyShareFallback);
closeShareFallbackButton.addEventListener("click", closeShareFallback);
howToDialog.addEventListener("click", (event) => {
  if (event.target === howToDialog) {
    closeHowTo();
  }
});
headerShareDialog.addEventListener("click", (event) => {
  if (event.target === headerShareDialog) {
    closeHeaderShare();
  }
});
shareFallbackDialog.addEventListener("click", (event) => {
  if (event.target === shareFallbackDialog) {
    closeShareFallback();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    persistDailyPlay();
    return;
  }

  if (taiwanDateKey() !== session.dateKey) {
    initializeDailyRun({
      message: "A new Taiwan day has begun. Today's first board is ready.",
      tone: "neutral",
    });
  }
});

window.addEventListener("pagehide", persistDailyPlay);

initializeDailyRun();
