import assert from "node:assert/strict";
import test from "node:test";

import {
  extractReleaseVersion,
  formatReleaseVersion,
  nextReleaseVersion,
  nextReleaseVersionForDate,
  normalizeReleaseVersionHtml,
  parseReleaseVersion,
  replaceReleaseVersion,
  validateReleaseTransition,
} from "../scripts/release-version.mjs";

function releaseHtml(version = "v260827r1") {
  return `<main></main>\n<footer><small class="release-version" id="releaseVersion">${version}</small></footer>\n`;
}

test("release versions parse and format the compact date/revision contract", () => {
  assert.deepEqual(parseReleaseVersion("v260827r1"), {
    dateKey: "2026-08-27",
    revision: 1,
    value: "v260827r1",
  });
  assert.equal(formatReleaseVersion("2026-12-31", 9), "v261231r9");
  assert.equal(formatReleaseVersion("2099-01-01", 100), "v990101r100");

  for (const version of [
    "260827r1",
    "v20260827r1",
    "v26827r1",
    "v260230r1",
    "v260827r0",
    "v260827r01",
  ]) {
    assert.throws(() => parseReleaseVersion(version), RangeError);
  }
  assert.throws(() => parseReleaseVersion(null), TypeError);
  assert.throws(() => formatReleaseVersion("2100-01-01", 1), RangeError);
  assert.throws(() => formatReleaseVersion("2026-08-27", 0), RangeError);
  assert.throws(
    () => formatReleaseVersion("2026-08-27", Number.MAX_SAFE_INTEGER + 1),
    RangeError,
  );
});

test("release revisions advance on Taiwan dates and reset to 1 after rollover", () => {
  assert.equal(
    nextReleaseVersionForDate("v260827r1", "2026-08-27"),
    "v260827r2",
  );
  assert.equal(
    nextReleaseVersionForDate("v260827r41", "2026-08-28"),
    "v260828r1",
  );
  assert.equal(
    nextReleaseVersionForDate("v260827r99", "2026-08-27"),
    "v260827r100",
  );
  assert.equal(
    nextReleaseVersion(null, new Date("2026-08-26T16:00:00.000Z")),
    "v260827r1",
  );
  assert.equal(
    nextReleaseVersion(
      "v260827r1",
      new Date("2026-08-27T15:59:59.999Z"),
    ),
    "v260827r2",
  );
  assert.equal(
    nextReleaseVersion(
      "v260827r2",
      new Date("2026-08-27T16:00:00.000Z"),
    ),
    "v260828r1",
  );

  assert.throws(
    () => nextReleaseVersionForDate("v260828r1", "2026-08-27"),
    /later than Taiwan date/,
  );
});

test("release HTML exposes and replaces exactly one valid static marker", () => {
  const original = releaseHtml();
  const bumped = replaceReleaseVersion(original, "v260827r2");

  assert.equal(extractReleaseVersion(original), "v260827r1");
  assert.equal(extractReleaseVersion(bumped), "v260827r2");
  assert.equal(
    normalizeReleaseVersionHtml(original),
    normalizeReleaseVersionHtml(bumped),
  );
  assert.equal(
    extractReleaseVersion("<main></main>", { allowMissing: true }),
    null,
  );
  assert.equal(normalizeReleaseVersionHtml("<main></main>"), "<main></main>");

  assert.throws(() => extractReleaseVersion("<main></main>"), /missing/);
  assert.throws(
    () => extractReleaseVersion('<small id="releaseVersion">dev</small>'),
    /malformed/,
  );
  assert.throws(
    () => extractReleaseVersion(`${original}${original}`),
    /exactly one/,
  );
});

test("release transitions require app changes to advance exactly once", () => {
  assert.equal(
    validateReleaseTransition({
      previousVersion: null,
      currentVersion: "v260827r1",
      releaseContentChanged: true,
      todayDateKey: "2026-08-27",
    }),
    "v260827r1",
  );
  assert.equal(
    validateReleaseTransition({
      previousVersion: "v260827r1",
      currentVersion: "v260827r1",
      releaseContentChanged: false,
      todayDateKey: "2026-08-27",
    }),
    "v260827r1",
  );
  assert.equal(
    validateReleaseTransition({
      previousVersion: "v260827r1",
      currentVersion: "v260827r2",
      releaseContentChanged: false,
      todayDateKey: "2026-08-27",
    }),
    "v260827r2",
  );
  assert.equal(
    validateReleaseTransition({
      previousVersion: "v260827r9",
      currentVersion: "v260828r1",
      releaseContentChanged: true,
      todayDateKey: "2026-08-28",
    }),
    "v260828r1",
  );

  assert.throws(
    () =>
      validateReleaseTransition({
        previousVersion: "v260827r1",
        currentVersion: "v260827r1",
        releaseContentChanged: true,
        todayDateKey: "2026-08-27",
      }),
    /without advancing/,
  );
  assert.throws(
    () =>
      validateReleaseTransition({
        previousVersion: "v260827r1",
        currentVersion: "v260827r3",
        releaseContentChanged: true,
        todayDateKey: "2026-08-27",
      }),
    /must advance.*r2/,
  );
  assert.throws(
    () =>
      validateReleaseTransition({
        previousVersion: null,
        currentVersion: "v260827r2",
        releaseContentChanged: true,
        todayDateKey: "2026-08-27",
      }),
    /Initial release version.*r1/,
  );
});
