export const DAILY_RUN_VERSION = 2;
export const TAIWAN_UTC_OFFSET_HOURS = 8;
export const DAILY_STORAGE_KEY = `twain:daily:v${DAILY_RUN_VERSION}`;
export const DIFFICULTY_CATALOG = Object.freeze([
  "easy",
  "medium",
  "hard",
  "extra",
  "ultra",
]);
export const MIN_DAILY_STAGES = 3;
export const MAX_DAILY_STAGES = 5;
export const FIRST_TWAIN_DATE_KEY = "2026-08-26";

const TAIWAN_OFFSET_MILLISECONDS =
  TAIWAN_UTC_OFFSET_HOURS * 60 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function timestampOf(value) {
  const timestamp = value instanceof Date ? value.getTime() : Number(value);

  if (!Number.isFinite(timestamp)) {
    throw new TypeError("Daily date input must be a valid timestamp or Date.");
  }

  return timestamp;
}

function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function createScheduleRandom(dateKey) {
  const seed = `twain-daily:v${DAILY_RUN_VERSION}:${dateKey}:schedule`;
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
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

export function taiwanDateKey(now = Date.now()) {
  return new Date(timestampOf(now) + TAIWAN_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

export function millisecondsUntilNextTaiwanDay(now = Date.now()) {
  const taiwanTimestamp = timestampOf(now) + TAIWAN_OFFSET_MILLISECONDS;
  const elapsedToday =
    ((taiwanTimestamp % DAY_MILLISECONDS) + DAY_MILLISECONDS) %
    DAY_MILLISECONDS;
  return DAY_MILLISECONDS - elapsedToday;
}

export function dailyTwainNumber(dateKey) {
  if (!isDateKey(dateKey)) {
    throw new RangeError(`Invalid daily date key: ${dateKey}`);
  }

  const dateTimestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  const firstTwainTimestamp = Date.parse(
    `${FIRST_TWAIN_DATE_KEY}T00:00:00.000Z`,
  );
  const number = (dateTimestamp - firstTwainTimestamp) / DAY_MILLISECONDS + 1;

  return number >= 1 ? number : null;
}

export function dailyStageSeed(dateKey, difficulty) {
  if (!isDateKey(dateKey)) {
    throw new RangeError(`Invalid daily date key: ${dateKey}`);
  }

  if (!DIFFICULTY_CATALOG.includes(difficulty)) {
    throw new RangeError(`Unknown daily difficulty: ${difficulty}`);
  }

  return `twain-daily:v${DAILY_RUN_VERSION}:${dateKey}:${difficulty}`;
}

export function dailySchedule(dateKey) {
  if (!isDateKey(dateKey)) {
    throw new RangeError(`Invalid daily date key: ${dateKey}`);
  }

  const random = createScheduleRandom(dateKey);
  const stageCount =
    MIN_DAILY_STAGES +
    Math.floor(random() * (MAX_DAILY_STAGES - MIN_DAILY_STAGES + 1));
  const difficulties = [...DIFFICULTY_CATALOG];

  for (let index = difficulties.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [difficulties[index], difficulties[swapIndex]] = [
      difficulties[swapIndex],
      difficulties[index],
    ];
  }

  return Object.freeze(difficulties.slice(0, stageCount));
}

export function dailyDifficultyAt(dateKey, stageIndex) {
  const schedule = dailySchedule(dateKey);

  if (
    !Number.isInteger(stageIndex) ||
    stageIndex < 0 ||
    stageIndex >= schedule.length
  ) {
    throw new RangeError(`Unknown daily stage index: ${stageIndex}`);
  }

  return schedule[stageIndex];
}
