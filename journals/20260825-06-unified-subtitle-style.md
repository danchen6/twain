---
date: 2026-08-25
sequence: 06
topic: unified-subtitle-style
supersedes: []
---

# Give the full canonical subtitle one visual voice

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The compact header rendered most of `Never the twain shall meet` as heavy dark system sans-serif while only the semantic `<em>` around `twain` used the orange italic Georgia accent. The split treatment made the phrase feel like two typographic ideas even though it is one canonical subtitle.

## Decision process

Apply the existing emphasized word's visual language to the entire `#pageTitle`: accent orange, Georgia-family serif, and italic style. Raise the weight from 500 to 600 so the smaller responsive header text remains crisp. Keep the `<em>` element for semantic emphasis, but make it inherit the heading font so it creates no visual discontinuity.

This preserves the established responsive font sizing and header layout; increasing the title size or changing the markup would expand the scope without improving the requested unification.

## Outcome

- The complete canonical subtitle now uses one orange italic Georgia treatment at weight 600.
- The nested `<em>` remains semantic and has the same computed font and color as its parent.
- The visual design contract, static contract test, and rendered Visual QA assertions now encode the unified treatment.

## Trade-offs and consequences

The full phrase now carries more accent color than before, but its compact size keeps the game board dominant. Georgia remains a system-font choice, preserving the project's dependency-free runtime and avoiding font-loading layout shifts.

## Verification

- `npm test`: 34/34 tests passed.
- `npm run visual-qa -- --output <temporary-directory>`: 20/20 checks passed with no runtime or browser-console errors.
- Inspected fresh captures at 1440×1000, 768×1024, 390×844, and 320×800. The subtitle stayed centered, unclipped, and visually coherent while the board remained fully above the fold.
- Rendered assertions confirmed that `#pageTitle` and its `<em>` share color, family, italic style, and weight 600 across every maintained layout check.
- No visual defect was found, so no correction/recapture cycle was required.
