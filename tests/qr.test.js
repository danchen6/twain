import assert from "node:assert/strict";
import test from "node:test";

import { QR_QUIET_ZONE, createQrCode } from "../src/qr.js";

const FINDER_PATTERN = [
  [true, true, true, true, true, true, true],
  [true, false, false, false, false, false, true],
  [true, false, true, true, true, false, true],
  [true, false, true, true, true, false, true],
  [true, false, true, true, true, false, true],
  [true, false, false, false, false, false, true],
  [true, true, true, true, true, true, true],
];

function assertFinderPattern(modules, rowOffset, columnOffset) {
  FINDER_PATTERN.forEach((expectedRow, row) => {
    expectedRow.forEach((expected, column) => {
      assert.equal(
        modules[rowOffset + row][columnOffset + column],
        expected,
      );
    });
  });
}

test("QR wrapper deterministically encodes Twain's canonical URL", () => {
  const value = "https://danchen6.github.io/twain/";
  const first = createQrCode(value);
  const second = createQrCode(value);

  assert.equal(first.moduleCount, 29);
  assert.equal(first.quietZone, 4);
  assert.equal(first.viewBoxSize, 37);
  assert.equal(first.modules.length, first.moduleCount);
  assert.ok(first.modules.every((row) => row.length === first.moduleCount));
  assert.equal(first.pathData, second.pathData);
  assert.ok(first.pathData.startsWith(`M${QR_QUIET_ZONE} ${QR_QUIET_ZONE}`));
  assert.ok(first.pathData.length > 0);

  assertFinderPattern(first.modules, 0, 0);
  assertFinderPattern(first.modules, 0, first.moduleCount - 7);
  assertFinderPattern(first.modules, first.moduleCount - 7, 0);
});

test("QR wrapper preserves a four-module quiet zone and changes with content", () => {
  const first = createQrCode("https://danchen6.github.io/twain/");
  const second = createQrCode("https://danchen6.github.io/twain/next");

  assert.equal(first.viewBoxSize - first.moduleCount, QR_QUIET_ZONE * 2);
  assert.notEqual(first.pathData, second.pathData);
});

test("QR wrapper rejects empty and non-string values", () => {
  assert.throws(() => createQrCode(""), TypeError);
  assert.throws(() => createQrCode(null), TypeError);
});
