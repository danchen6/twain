---
date: 2026-08-25
sequence: 3
topic: square-board-visuals
supersedes: ["20260825-02-twain-mode.md"]
---

# Square the board and simplify Twain clue styling

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

After playing the first Twain-mode implementation, the board's rounded corners, blue focus outline, rounded Line B clues, undersized A/B clue prefixes, and `ENDLESS NUMBER PATHS` eyebrow felt visually unnecessary. This updates the rounded-board and rounded-square Line B conclusions recorded in `20260825-02-twain-mode.md`; its gameplay and mode decisions remain current.

## Decision process

- Remove board rounding at both rendering layers. Changing only the CSS container would leave rounded SVG background, clipping, and outline geometry inside it, so the SVG `rx` values and rounded clip path were removed too.
- Make Line B clue shapes fully square on the board and in the How-to illustration. Line A remains circular, preserving a strong shape distinction.
- Give A/B prefixes the same computed font size as their clue numbers across every Twain clue, rather than special-casing literal A1 or B2 values.
- Remove the eyebrow element and its now-unused style so the subtitle starts the hero hierarchy directly.
- Remove the board's blue focus outline without substituting another border, as requested. Other interactive controls retain their standard visible focus treatment. A future non-outline board cue is recorded in the backlog because the absent board-specific indicator weakens keyboard focus discoverability.

## Outcome

- Twain and Classic boards have square CSS containers, SVG backgrounds, clipping bounds, and outlines.
- Line B clues and their How-to samples have zero border radius.
- Twain clue prefixes and numbers use the same font size.
- The hero contains no eyebrow above **Never the twain shall meet**.
- Focusing the game board produces no outer blue outline.
- The Visual QA harness now asserts these computed rendering properties instead of relying only on screenshot judgment.

## Trade-offs and consequences

The sharper geometry makes the play surface and Line B identity more explicit. Removing the board outline also removes its dedicated visual keyboard-focus signal; the persistent active-line selection still communicates gameplay context, but a non-border accessibility treatment should be designed before public launch.

## Verification

- `npm test`: 32/32 tests pass, including a new static visual-contract regression.
- `npm run visual-qa`: 19/19 browser checks pass with no runtime or console errors.
- Thirteen screenshots were inspected at 1440×1000, 768×1024, 390×844, and 320×800. Coverage included Twain fresh, invalid, drawing, Hint correction, focus, completion, touch, and reduced motion plus Classic fresh and completion states.
- Square edges, square Line B clues, equal-size clue text, eyebrow removal, and absence of the blue focus outline remained clean at every relevant state and viewport; no post-capture defect was found.
- `git diff --check` passes. Temporary screenshots remain outside the repository.

## Follow-ups

Design a non-outline board keyboard-focus cue before public launch; the accepted risk is tracked in `BACKLOG.md`.
