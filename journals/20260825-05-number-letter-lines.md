---
date: 2026-08-25
sequence: 5
topic: number-letter-lines
supersedes: ["20260825-04-compact-game-layout.md"]
---

# Replace prefixed clues with Number and Letter lines

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The enlarged `A1/B1` clue treatment still required players to parse two adjacent glyphs inside a small shape. Lightening only the prefix would improve hierarchy but retain that visual density; removing the prefix while keeping both lines numeric would make their duplicate sequences depend entirely on shape. The accepted simplification gives each line its own visible sequence instead.

This supersedes the prior entry's tightly spaced A/B-prefix conclusion and its visible active-line controls. Its compact header, removed status/footer chrome, above-the-fold board, and Clear/Replay timer semantics remain current.

## Decision process

- Present internal line `a` as the round **Number line** with `1, 2, 3…`, and line `b` as the square **Letter line** with `A, B, C…`. Calling them Number and Letter avoids the contradictory wording of a “B line” whose first clue is `A`.
- Keep serialized clue values as contiguous integers. `clueDisplayValue()` maps only Letter-line presentation to spreadsheet-style labels, including `AA…` after `Z`, so puzzle format version 2, validation, seeded output, and game rules do not change.
- Remove the line-selector component instead of replacing it with another control. Pointer/touch gestures already infer ownership from a clue or existing path; keyboard users retain explicit selection through `N` and `L`.
- Mark activity with a static 45% opacity on the inactive clue family and route, returning both lines to full opacity on completion. A continuously animated gradient was rejected because it would compete with route drawing and add a reduced-motion branch without improving the state model.
- Set Twain clue weight to 600. Weight 500 was considered, but 600 retained stronger small-screen legibility against filled clue shapes while still being substantially quieter than the previous 780/900 treatment.

## Outcome

- Twain boards display only numeric round clues and alphabetic square clues; no A/B prefix or special letter spacing remains.
- The visible line selector and all of its DOM, CSS, and event wiring are gone.
- Number line is active on a fresh board. Starting a gesture on the other line's clue/path switches activity automatically and reverses the fade.
- `N` and `L` select Number and Letter lines for keyboard play. How-to copy, hidden live feedback, hit-target labels, README, and semantic docs use the same terminology.
- Classic rendering and its numeric-only rules remain unchanged.
- Visual QA asserts clue alphabets, font weight, selector absence, both fade directions, full-opacity completion, and the 140ms transition's settled state.

## Trade-offs and consequences

The new sequences eliminate prefix parsing and make shape, color, and sequence independently meaningful. Removing the selector reduces page chrome and brings the board higher, but active-line selection is now learned from direct manipulation and the How-to keyboard note rather than a persistent control. The 45% inactive treatment is intentionally strong for the prototype; its reduced clue contrast needs validation before public launch and is recorded in the backlog.

## Verification

- `npm test`: 34/34 tests pass, including Number/Letter naming, numeric-to-alphabetic display mapping through `Z` and `AA`, selector absence, 600-weight clue typography, and inactive-line styling.
- Final `npm run visual-qa -- --output /tmp/twain-visual-qa-number-letter-lines-final`: 20/20 browser checks pass with no runtime or console errors.
- Fourteen final screenshots were opened and inspected at 1440×1000, 768×1024, 390×844, and 320×800. Coverage included Twain fresh, invalid, Number-active drawing, Letter-active switching, Hint correction, focus, completion, touch, and reduced motion plus Classic fresh and completion.
- The first automated pass exposed a harness timing error: opacity was read before the 140ms active-line transition settled. The harness now waits 180ms before asserting switched and completed opacity, and the final recapture passes.
- Numeric and alphabetic clues remained legible without clipping at every viewport; selector removal left no spacing gap; inactive routes/clues switched together; both lines returned to full color on completion; the board stayed above the fold throughout the maintained matrix.
- `git diff --check` passes. Temporary screenshots remain outside the repository.

## Follow-ups

Validate the inactive-line opacity and selector-free keyboard discoverability before public launch; the accepted prototype risk is tracked in `BACKLOG.md`.
