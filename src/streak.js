import { FIRST_TWAIN_DATE_KEY } from "./daily.js";

export const STREAK_STORAGE_VERSION = 1;
export const STREAK_STORAGE_KEY = `twain:streak:v${STREAK_STORAGE_VERSION}`;

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function dayDifference(laterDateKey, earlierDateKey) {
  return (
    (Date.parse(`${laterDateKey}T00:00:00.000Z`) -
      Date.parse(`${earlierDateKey}T00:00:00.000Z`)) /
    DAY_MILLISECONDS
  );
}

function isNonnegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function createStreakRecord() {
  return {
    version: STREAK_STORAGE_VERSION,
    currentStreak: 0,
    longestStreak: 0,
    totalCompletedDays: 0,
    lastCompletedDate: null,
  };
}

export function restoreStreakRecord(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const validCounts =
    isNonnegativeInteger(candidate.currentStreak) &&
    isNonnegativeInteger(candidate.longestStreak) &&
    isNonnegativeInteger(candidate.totalCompletedDays) &&
    candidate.currentStreak <= candidate.longestStreak &&
    candidate.longestStreak <= candidate.totalCompletedDays;
  const empty =
    candidate.currentStreak === 0 &&
    candidate.longestStreak === 0 &&
    candidate.totalCompletedDays === 0 &&
    candidate.lastCompletedDate === null;
  const populated =
    candidate.currentStreak > 0 &&
    typeof candidate.lastCompletedDate === "string" &&
    isDateKey(candidate.lastCompletedDate) &&
    candidate.lastCompletedDate >= FIRST_TWAIN_DATE_KEY;

  if (
    candidate.version !== STREAK_STORAGE_VERSION ||
    !validCounts ||
    (!empty && !populated)
  ) {
    return null;
  }

  return {
    version: STREAK_STORAGE_VERSION,
    currentStreak: candidate.currentStreak,
    longestStreak: candidate.longestStreak,
    totalCompletedDays: candidate.totalCompletedDays,
    lastCompletedDate: candidate.lastCompletedDate,
  };
}

export function recordDailyCompletion(candidate, dateKey) {
  if (!isDateKey(dateKey)) {
    throw new RangeError(`Invalid streak date key: ${dateKey}`);
  }

  const current = restoreStreakRecord(candidate) ?? createStreakRecord();

  if (dateKey < FIRST_TWAIN_DATE_KEY) {
    return current;
  }

  if (
    current.lastCompletedDate !== null &&
    dateKey <= current.lastCompletedDate
  ) {
    return current;
  }

  const consecutive =
    current.lastCompletedDate !== null &&
    dayDifference(dateKey, current.lastCompletedDate) === 1;
  const currentStreak = consecutive ? current.currentStreak + 1 : 1;

  return {
    version: STREAK_STORAGE_VERSION,
    currentStreak,
    longestStreak: Math.max(current.longestStreak, currentStreak),
    totalCompletedDays: current.totalCompletedDays + 1,
    lastCompletedDate: dateKey,
  };
}

export function activeStreakForDate(candidate, dateKey) {
  if (!isDateKey(dateKey)) {
    throw new RangeError(`Invalid streak date key: ${dateKey}`);
  }

  const current = restoreStreakRecord(candidate);

  if (!current?.lastCompletedDate) {
    return 0;
  }

  const difference = dayDifference(dateKey, current.lastCompletedDate);
  return difference === 0 || difference === 1 ? current.currentStreak : 0;
}
