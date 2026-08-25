import assert from "node:assert/strict";
import test from "node:test";

import {
  ROUTE_PALETTES,
  routePaletteForSeed,
} from "../src/palette.js";

function rgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function colorDistance(first, second) {
  const left = rgb(first);
  const right = rgb(second);
  return Math.hypot(...left.map((value, index) => value - right[index]));
}

test("route palettes are deterministic per seed and expose strong line contrast", () => {
  assert.equal(routePaletteForSeed("same-seed"), routePaletteForSeed("same-seed"));

  for (const palette of ROUTE_PALETTES) {
    assert.equal(palette.a.stops.length, 3);
    assert.equal(palette.b.stops.length, 3);
    assert.ok(
      colorDistance(palette.a.accent, palette.b.accent) >= 150,
      `${palette.id} does not preserve enough line separation`,
    );
  }
});

test("seed selection reaches every curated route palette", () => {
  const selected = new Set(
    Array.from({ length: 500 }, (_, index) =>
      routePaletteForSeed(`palette-coverage-${index}`).id,
    ),
  );

  assert.deepEqual(selected, new Set(ROUTE_PALETTES.map(({ id }) => id)));
});
