---
date: 2026-08-25
sequence: 15
topic: header-help-share
supersedes:
  - "20260825-03-square-board-visuals.md"
  - "20260825-04-compact-game-layout.md"
  - "20260825-13-daily-twain-run.md"
  - "20260825-14-shuffled-daily-celebration.md"
---

# Reduce daily chrome and move guidance into the header

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The first shuffled-daily UI still printed stage/difficulty copy above its segmented progress bar, hid the Twain wordmark at iPhone widths, kept How-to content inline below the game, and exposed a copy-link action with a chain icon. Invalid play also shook the full board, while completion copy repeated difficulty and elapsed time that were already represented elsewhere.

The desired direction was a quieter, platform-native header and a more concise celebration: preserve the date and segmented run context, but remove redundant words and motion.

## Decision process

- Remove the visible progress string entirely instead of retaining an unclassified replacement element. The progressbar keeps `aria-valuenow`, `aria-valuemax`, and a contextual `aria-valuetext`, so the compact visual treatment does not erase its accessible meaning.
- Promote the current-segment orange mix to a named theme-accent token and use that exact computed color for the centered `1rem` date. Normal tracking replaces the previous compressed date styling.
- Keep both mark and **Twain** wordmark at every maintained width. Two icon-only actions fit on the opposite edge: `?` opens guidance and the platform-style upward Share icon starts sharing.
- Move the existing independent rule illustrations and keyboard guidance into a native `<dialog>`. This uses browser focus trapping, Escape handling, and focus restoration without adding runtime code or a dependency; Close and backdrop dismissal remain explicit alternatives.
- Prefer `navigator.share()` with Twain title/copy and the canonical query/hash-free URL. A cancelled share is intentionally silent. An unavailable or failed platform share falls back to `navigator.clipboard.writeText()` with off-layout live feedback.
- Remove the invalid-board animation rather than substituting another transient effect. Rejected moves still preserve state and reach the live announcer.
- Use **Nicely done!** for both intermediate and final overlays. Only cumulative Hint count remains below it; intermediate stages use the stable **Next level** label, while final completion has no action.

## Outcome

The header now reads full Twain brand / accented date / Help and Share icons at desktop and iPhone widths. The play page no longer contains inline rules or visible progress copy. Help opens a responsive modal tutorial without changing board position, and Share chooses the system menu or canonical-URL clipboard fallback.

Invalid input leaves the board visually still. Both completion states keep the existing veil, panel, and confetti celebration while removing difficulty, daily time, and destination-specific button copy.

## Trade-offs and consequences

Removing visible stage names makes the run deliberately less analytical: players see how many segments exist and which are complete, but not the sampled difficulty label. Screen readers retain the stage name and count through `aria-valuetext`.

The native dialog targets current browsers and deliberately avoids a compatibility abstraction, consistent with the unpublished dependency-free prototype. System share availability and destination choices remain platform-controlled; clipboard is the deterministic fallback rather than a custom sharing menu.

Sighted invalid-move explanation is now intentionally absent because both the prior visible status area and the board nudge are gone. The rejected path does not change, which is the primary immediate feedback; the live announcement remains available to assistive technology.

## Verification

- `npm test`: 49/49 tests pass, including static regressions for the removed progress copy and shake, shared theme accent, full mobile wordmark, dialog controls, concise completion copy, and Web Share/clipboard implementation.
- `npm run visual-qa`: Microsoft Edge exits cleanly with 26 browser checks, 17 screenshots, and no runtime/console errors. The harness exercises both sharing branches, dialog open/Close/Escape behavior, invalid input with `animation-name: none`, concise intermediate/final overlays, and the existing daily lifecycle/input matrix.
- Every capture was inspected at original resolution across 1440×1000, 768×1024, 390×844, and 320×800. The full wordmark, date, and paired header icons remain balanced at 320px; the 390px tutorial is contained and legible; progress segments have no residual copy; both overlays fit the board; Ultra clues and controls remain clean.
- `node --check src/main.js`, `node --check .agents/skills/visual-qa/scripts/run.mjs`, and `git diff --check` pass. Temporary browser artifacts remain outside the repository.
