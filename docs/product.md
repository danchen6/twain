# Product Contract

## Identity

The canonical product name is **Twain**, with the subtitle **Never the twain shall meet**. The subtitle remains the metadata and written tagline for the non-crossing two-line mechanic; the compact play header uses today's date instead so the active run has clearer context. The brand mark is a capital `T` formed by two differently colored strokes whose deliberate junction gap repeats the rule that the lines never meet.

## Goal

Provide one original three-to-five-stage puzzle run per Taiwan calendar date. A single player guides two lines that divide every selected board without meeting.

## Release status

Twain is an MIT-licensed public preview. The preview asserts the documented puzzle invariants and release gates, but it does not claim broad human difficulty calibration, full physical-device coverage, or stable-release readiness. Focused external contributions may be accepted; the roadmap and maintenance do not depend on them.

## Rules

1. Draw the round Number line through `1, 2, 3…` and the square Letter line through `A, B, C…`.
2. Move only between orthogonally adjacent cells.
3. A line may use only its own clues and must visit them in displayed order.
4. Never repeat a cell, share a cell between lines, or cross a wall.
5. Each line ends on its final clue; either line may finish first.
6. Together the two lines must occupy every grid cell.

There is no required per-line length or cell quota. Generated witnesses prove solvability but do not prescribe the player's partition; any valid full-board partition wins.

Moving from a line's tail to its immediate predecessor backtracks exactly one cell, so players can reverse naturally along the route. Moving onto any older body cell is rejected instead of deleting a long suffix. Undo remains the global chronological correction action.

## Daily run

- Taiwan time (fixed GMT+8) defines the date boundary; a new day starts at 16:00 UTC.
- Every date deterministically samples three to five unique levels from Easy, Medium, Hard, Extra, and Ultra, then shuffles their order. The same date and deployed version produce the same schedule and boards in every browser.
- Stages unlock sequentially. Progress is informative, not a stage selector.
- One elapsed timer spans the selected stages. It pauses after a stage, resumes on the first valid move or Hint in the next stage, and stops after the final selected level.
- Clear removes only the current board's paths and Undo history. It never resets elapsed daily time or completed stages.
- The current stage, paths, active line, Undo history, hint/mistake counts, and elapsed time persist in localStorage. Reload restores them paused until the next valid move or Hint. Persistence is browser-local, not cross-device.
- Reloading, returning to a visible tab, or reaching zero on the finished-run countdown after the Taiwan date changes starts the new daily run.
- Share sends the canonical page URL to the platform share sheet when a secure browser context supports it. Otherwise it copies immediately, or exposes selected share text in a visible fallback dialog when automatic copying is blocked. The date-to-seed rule, rather than query parameters, makes the linked board set reproducible.
- Final completion remains visible after reload with the finished time, cumulative Hint count, a live countdown to the next Taiwan day, and a Share action whose result copy includes the finished time and canonical URL.

## Current scope

- Pointer/touch drawing, tap-to-step, clue/path-driven line selection, keyboard arrows plus `N`/`L`, cell-by-cell backtracking, body-collision rejection, global Undo, Clear, and Hint.
- Curated high-contrast route gradients selected deterministically from each stage seed.
- A header Help action opens the compact rule tutorial as a native modal; Share uses the platform menu, clipboard/selected-text compatibility copying, or a manual-copy modal in that order.
- Mobile play suppresses accidental double-tap zoom and long-press selection while preserving pinch zoom away from the board.
- Responsive, dependency-free, static Web UI hosted without a runtime service.

The game remains single-player. Accounts, cross-device sync, historical-date selection, custom seeds, a puzzle archive, streaks, leaderboards, and social collaboration are not current scope.

## Visual contract

The binding visual language is in [design.md](design.md). Do not reproduce third-party logos, wordmarks, proprietary icons, page chrome, boards, or exact assets.

## Product quality boundary

All generated boards are guaranteed solvable. Uniqueness is not required. Difficulty bands are calibrated by deterministic bounded search over candidate boards, using search effort and capped solution density rather than clue or wall count alone. This is a reproducible engineering proxy, not proof of human-perceived difficulty; the five available bands still need broader playtest validation before the public preview can graduate to a stable release.
