---
date: 2026-08-25
sequence: 08
topic: mobile-path-palette-ux
supersedes: ["20260825-02-twain-mode.md"]
---

# Reject path rewinds and derive contrasting route palettes from the seed

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

On phones, a quick second tap could trigger browser zoom while playing. Moving onto an earlier cell of the active path also used the original drag-back convention and silently shortened the route, which made an attempted forward move destructive. Finally, every puzzle used the same orange and teal route colors even though the seed already supplied a natural source of reproducible visual variety.

This partially supersedes the Twain-mode decision that drag-back trims the active line and that each line has one fixed route hue. Global chronological Undo, shape-based Number/Letter identity, deterministic puzzles, and the two-line rules remain unchanged.

## Decision process

- Reject `user-scalable=no` and `maximum-scale=1`. They would prevent accidental double-tap zoom, but would also declare pinch zoom unavailable to low-vision players. Apply `touch-action: manipulation` to the page instead; the board keeps `touch-action: none` for stable drawing, while pinch zoom remains available away from the board.
- Reject implicit path rewinding. `applyMove()` now treats an earlier active-line cell as an invalid occupied target and preserves both path maps. The current tail remains a quiet no-op, tapping any existing path still selects its owning line, and explicit Undo is the only one-step correction mechanism.
- Reject arbitrary hue rotation because numerical hue distance alone does not guarantee that both rendered routes remain distinct against the board and each other. Maintain a small curated set of six gradient pairs, verify a color-separation floor, and select one through the namespaced `route-palette:v1:<seed>` random stream.
- Keep palette data outside the puzzle schema. It is a deterministic presentation derivative of the existing seed, so shared URLs reproduce it without adding state or changing generated puzzle logic.

## Outcome

- Mobile double taps no longer change page scale in the maintained touch browser, without disabling pinch zoom through viewport metadata.
- Moving or dragging into an earlier cell of the active line is rejected with hidden accessible feedback; no cell disappears. Undo remains available for deliberate reversal.
- Six curated high-contrast gradient pairs can color the Number and Letter routes. The seed deterministically selects the pair, and visited clue borders, current-clue emphasis, route starts, and How-to samples inherit the selected accents.
- The Visual QA harness now covers two seeds, occupied-cell rejection followed by Undo, and a synthesized mobile double tap.

## Trade-offs and consequences

Removing drag-back makes route correction one explicit Undo at a time. That is slightly slower for deleting a long suffix, but avoids a forward gesture unexpectedly erasing progress and keeps correction behavior consistent across pointer and keyboard input.

The palette is reproducible but presentational, not part of the puzzle-format compatibility invariant. Reordering or editing the curated list would change colors for existing seed URLs, so future visual changes should be deliberate even though they do not change the board solution. Shape, sequence, and active-line opacity continue to carry identity for players who cannot distinguish a particular color pair.

## Verification

- `npm test`: 42/42 tests passed. New coverage verifies immutable occupied-cell rejection, deterministic palette selection, reachability of every curated pair, the maintained color-separation floor, and a zoom policy that does not add restrictive viewport metadata.
- The final `npm run visual-qa` run passed 27/27 browser checks in Microsoft Edge with no runtime or console errors. The synthesized double tap left `visualViewport.scale` unchanged; the fixed seed reproduced its palette, and a second seed changed both route accents.
- All 19 initial screenshots were opened and inspected across 1440×1000, 768×1024, 390×844, and 320×800. That inspection found that the How-to panel was outside the initial custom-property scope; the accents were moved to the document root, the harness gained an inheritance assertion and full-page alternate-palette capture, and the final run was recaptured. Targeted final inspection covered fixed/alternate palettes, Classic, and 390px states. Both completed Twain routes remained clearly distinguishable and no responsive defect remained.
- Syntax checks for all changed JavaScript entry points and `git diff --check` passed. Temporary screenshots remain outside the repository.
