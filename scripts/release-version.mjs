import { taiwanDateKey } from "../src/daily.js";

export const RELEASE_VERSION_PATTERN =
  /^v(?<year>\d{2})(?<month>\d{2})(?<day>\d{2})r(?<revision>[1-9]\d*)$/;

const RELEASE_ELEMENT_PATTERN =
  /<small class="release-version" id="releaseVersion">\s*(?<version>[^<]*?)\s*<\/small>/g;
const RELEASE_VERSION_PLACEHOLDER = "v000101r1";

function validateDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError(`Invalid release date: ${dateKey}`);
  }

  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== dateKey
  ) {
    throw new RangeError(`Invalid release date: ${dateKey}`);
  }

  const year = Number(dateKey.slice(0, 4));
  if (year < 2000 || year > 2099) {
    throw new RangeError("Release versions support dates from 2000 through 2099.");
  }

  return dateKey;
}

export function parseReleaseVersion(value) {
  if (typeof value !== "string") {
    throw new TypeError("Release version must be a string.");
  }

  const match = RELEASE_VERSION_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Invalid release version: ${value}`);
  }

  const dateKey = validateDateKey(
    `20${match.groups.year}-${match.groups.month}-${match.groups.day}`,
  );
  const revision = Number(match.groups.revision);
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new RangeError("Release revision must be a positive safe integer.");
  }

  return Object.freeze({ dateKey, revision, value });
}

export function formatReleaseVersion(dateKey, revision) {
  validateDateKey(dateKey);

  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new RangeError("Release revision must be a positive safe integer.");
  }

  const [year, month, day] = dateKey.split("-");
  return `v${year.slice(2)}${month}${day}r${revision}`;
}

export function nextReleaseVersionForDate(currentVersion, dateKey) {
  validateDateKey(dateKey);

  if (currentVersion === null) {
    return formatReleaseVersion(dateKey, 1);
  }

  const current = parseReleaseVersion(currentVersion);
  if (current.dateKey > dateKey) {
    throw new RangeError(
      `Current release ${currentVersion} is later than Taiwan date ${dateKey}.`,
    );
  }

  const revision = current.dateKey === dateKey ? current.revision + 1 : 1;
  return formatReleaseVersion(dateKey, revision);
}

export function nextReleaseVersion(currentVersion, now = Date.now()) {
  return nextReleaseVersionForDate(currentVersion, taiwanDateKey(now));
}

function releaseVersionMatches(html) {
  return [...html.matchAll(RELEASE_ELEMENT_PATTERN)];
}

export function extractReleaseVersion(html, { allowMissing = false } = {}) {
  if (typeof html !== "string") {
    throw new TypeError("Release HTML must be a string.");
  }

  const matches = releaseVersionMatches(html);
  if (matches.length === 0) {
    if (html.includes('id="releaseVersion"')) {
      throw new RangeError("Release version element is malformed.");
    }
    if (allowMissing) {
      return null;
    }
    throw new RangeError("Release version element is missing.");
  }
  if (matches.length !== 1) {
    throw new RangeError("Release HTML must contain exactly one release version.");
  }

  const version = matches[0].groups.version.trim();
  parseReleaseVersion(version);
  return version;
}

export function replaceReleaseVersion(html, version) {
  parseReleaseVersion(version);
  const matches = releaseVersionMatches(html);
  if (matches.length !== 1) {
    throw new RangeError("Release HTML must contain exactly one release version.");
  }

  const match = matches[0];
  const versionOffset = match[0].indexOf(match.groups.version);
  const start = match.index + versionOffset;
  const end = start + match.groups.version.length;
  return `${html.slice(0, start)}${version}${html.slice(end)}`;
}

export function normalizeReleaseVersionHtml(html) {
  const currentVersion = extractReleaseVersion(html, { allowMissing: true });
  return currentVersion === null
    ? html
    : replaceReleaseVersion(html, RELEASE_VERSION_PLACEHOLDER);
}

export function validateReleaseTransition({
  previousVersion,
  currentVersion,
  releaseContentChanged,
  todayDateKey,
}) {
  validateDateKey(todayDateKey);
  parseReleaseVersion(currentVersion);

  if (typeof releaseContentChanged !== "boolean") {
    throw new TypeError("releaseContentChanged must be a boolean.");
  }

  if (previousVersion === null) {
    if (!releaseContentChanged) {
      throw new Error("The initial release version must accompany app content.");
    }
    const expected = formatReleaseVersion(todayDateKey, 1);
    if (currentVersion !== expected) {
      throw new Error(`Initial release version must be ${expected}.`);
    }
    return currentVersion;
  }

  parseReleaseVersion(previousVersion);
  const versionChanged = currentVersion !== previousVersion;
  if (releaseContentChanged && !versionChanged) {
    throw new Error(
      `App content changed without advancing release version ${previousVersion}.`,
    );
  }

  if (!versionChanged) {
    return currentVersion;
  }

  const expected = nextReleaseVersionForDate(previousVersion, todayDateKey);
  if (currentVersion !== expected) {
    throw new Error(
      `Release version must advance from ${previousVersion} to ${expected}, not ${currentVersion}.`,
    );
  }

  return currentVersion;
}
