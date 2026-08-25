---
date: 2026-08-25
sequence: 10
topic: iphone-clue-fit
supersedes: ["20260825-05-number-letter-lines.md", "20260825-07-solver-calibrated-extra.md"]
---

# Keep multi-glyph clues inside their shapes on iPhone

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

An iPhone screenshot of Extra seed `0ftu1kh1lhp3` showed Number clues `10`, `11`, and `12` reaching beyond their circles. It also showed that Number and Letter glyphs were optically high rather than vertically centered. A later close crop of clue `10` showed one more font-metric issue: after containment was fixed, the two-digit ink still sat slightly right of the circle's visual center even though its DOM line box was centered.

This corrects the earlier conclusions that Number/Letter clues remained legible without clipping throughout the maintained viewport matrix. Those checks proved that clue elements stayed inside the viewport, but did not measure whether the inner text crossed its own shape border. Chromium screenshots also did not expose the same system-font metrics as iPhone Safari. Puzzle data, cell hit targets, and route geometry were unaffected.

## Decision process

- Trace the overflow to box geometry rather than the generated values. On a 10×10 mobile board, a Twain clue uses 68% of one cell while its transparent 3px border still consumes both sides of the border-box; the remaining content width can be narrower than two tabular digits.
- Reject shrinking every clue. Single-glyph clues already have the intended prominence, so lowering the global size would solve one edge case by weakening the common case.
- Classify rendered display strings by glyph count. Multi-glyph clues receive a modestly wider shape, a responsive font, and tighter `-0.075em` tracking. The tighter pair fit permits increasing the multi-glyph size above the first conservative fix while retaining inner-border clearance. The rule is presentation-based, so it also covers future Letter values such as `AA` without changing serialized clue integers.
- Keep the existing grid centering, but move the glyph line box down by `0.04em` to correct the system font's optical bias.
- Do not use the DOM line-box center as proof of horizontal optical alignment. Tabular `1` has asymmetric visible ink inside its advance box, so shift only multi-digit Number values left by `0.06em`; single digits and Letter clues already align correctly and remain untouched.
- Replace viewport-only confidence with direct browser measurements. Visual QA now checks every clue value against the inner border, requires multi-glyph classification, and bounds vertical line-box offset at every maintained viewport.
- Preserve the reported seed as a regression. The 390px and 320px Extra runs now render the exact board containing `10`, `11`, and `12` rather than relying on a nearby fixed fixture.

## Outcome

- Two-character clues stay inside their circles or squares at 320px, 390px, and desktop widths, including fresh and drawn states.
- Single-character clue size and weight remain unchanged. Multi-glyph shapes grow only slightly; tighter tracking lets their responsive type stay visibly larger while retaining inner-border space.
- Number and Letter glyphs share the same optical vertical correction in Twain and Classic modes.
- Multi-digit Number glyphs receive a small horizontal optical correction without moving their circles, hit targets, single-digit peers, or Letter clues.
- The reusable Visual QA procedure now guards inner glyph geometry, not only page and element overflow.

## Trade-offs and consequences

Multi-glyph clues intentionally remain somewhat smaller than single-glyph clues. Their tighter tracking reduces character separation slightly, but the two tabular digits remain distinct and gain more useful height. The number-only `-0.06em` shift is an optical correction rather than mathematical centering, so it deliberately differs from Letter clues. Keeping identical type size would require substantially larger circles in dense Extra cells, increasing collisions with walls and routes; the accepted treatment favors containment and shape consistency.

The exact seed passes Chromium's geometric assertions with visible margin, but browser DOM bounds cannot reproduce Safari's glyph rasterization exactly. A post-fix physical iOS Safari spot-check remains in `BACKLOG.md`; the user-provided HEIC and its temporary PNG conversion remain outside the repository.

## Verification

- `npm test`: 43/43 tests passed. Static coverage guards glyph-count metadata, multi-glyph sizing and tracking, and the number-only horizontal/vertical optical-alignment rules alongside the full generator, solver, game, and deployment suites.
- The final `npm run visual-qa` run passed 28/28 checks in Microsoft Edge with no runtime or console errors and produced 21 temporary screenshots. Every maintained layout passed inner-border containment, multi-glyph classification, and vertical-offset assertions.
- Exact seed `0ftu1kh1lhp3` rendered clues `10`, `11`, and `12` at both 390×844 and 320×800. Both final Extra captures were opened at original resolution; the larger, tighter values remained legible and clear of their inner borders, with the Number line's intended optical offset present and single-glyph centering unchanged.
- The final 390px `10` capture was enlarged to the scale of the user-provided close crop and inspected again. Its visible digit-pair center now tracks the circle center without moving the neighboring single-glyph clues; the temporary enlargement and source screenshots remain outside the repository.
- Changed JavaScript syntax and `git diff --check` passed.
