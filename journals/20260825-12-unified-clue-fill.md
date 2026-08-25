---
date: 2026-08-25
sequence: 12
topic: unified-clue-fill
supersedes: ["20260825-02-twain-mode.md", "20260825-05-number-letter-lines.md"]
---

# Give both clue families one black-and-white palette

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain distinguished the Number line with round near-black clues and the Letter line with square navy clues. After the sequences became intrinsically different—numbers versus letters—the second clue fill added visual vocabulary without adding necessary identity. The accepted simplification makes both clue families match the Number line's black background and white type.

This supersedes the earlier decisions that Letter clues use a navy fill and that clue color independently identifies line ownership. Numeric/alphabetic sequences, round/square geometry, active-line fading, and seed-derived route colors remain current.

## Decision process

- Use the Number clue's `#292018` fill and white text for both board clue families. Keep the Letter clue square and the Number clue round, so ownership remains identifiable without color.
- Apply the same shared fill to the How-to samples; teaching imagery should not preserve a color distinction the board no longer uses.
- Preserve seed-selected route gradients, visited borders, and current-clue rings. Color still distinguishes drawn routes and state accents, while shape and sequence distinguish the clues.
- Preserve the 45% inactive-line opacity. An inactive clue therefore appears muted even though its underlying fill is the same black; removing that state cue would be a separate active-line-discoverability decision.
- Add computed-style browser assertions for equal board/sample backgrounds and white foregrounds instead of relying only on source literals or visual inspection.

## Outcome

- Active and completed Number and Letter clues use identical black backgrounds and white type.
- Fresh and drawing states retain the existing active/inactive distinction through opacity.
- Round numeric and square alphabetic geometry remains immediately legible at every maintained board density.
- The How-to samples now match the board's simplified clue palette.

## Trade-offs and consequences

The clues lose one redundant identity channel, but the difference remains explicit through both glyph system and shape. Route colors still provide strong live-path separation. Because opacity remains stateful, “same fill” does not mean both clue families render at equal darkness while one line is inactive; this is intentional and preserves the selector-free active-line cue.

## Verification

- `npm test`: 43/43 tests passed. Static coverage requires identical Number/Letter fill, shared white type in the rendered contract, and removal of the former navy literal alongside the full game, generator, solver, and deployment suites.
- The final `npm run visual-qa` run passed 28/28 checks in Microsoft Edge with no runtime or console errors and produced 21 temporary screenshots.
- Desktop fresh, Letter-active, completion, full How-to, and 390×844 Extra captures were opened at original resolution. Both shapes stayed legible; active/completed clues matched exactly; inactive fading, route accents, and multi-glyph fit remained clean.
- Changed JavaScript syntax and `git diff --check` passed.
