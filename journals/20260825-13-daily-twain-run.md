---
date: 2026-08-25
sequence: 13
topic: daily-twain-run
supersedes:
  - "20260825-02-twain-mode.md"
  - "20260825-04-compact-game-layout.md"
  - "20260825-07-solver-calibrated-extra.md"
---

# Turn Twain into one deterministic five-stage daily run

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain had become the stronger game, so retaining a separate one-line mode and arbitrary mode/difficulty/New controls added product surface without improving the intended experience. The requested replacement was one shared group of boards per day, five sequential difficulties, a daily progress bar, and one timer across the run. Dan approved three implementation decisions before work began: promote the tuned 10×10 profile to Ultra and insert an 8×8 Extra, persist progress locally in the browser, and change days on reload or when a tab becomes visible under a new Taiwan date.

This supersedes the earlier selectable-mode/schema decision, the layout decision that Replay/New remained distinct reset actions, and the conclusion that the 10×10 stretch profile was named Extra. The two-line rules, non-quota completion, compact header, Clear-preserves-time behavior, solver calibration, clue geometry, and seed-derived palettes remain current.

## Decision process

- Remove the product mode dimension completely rather than hiding dormant branches. Puzzle schema v4 always contains lines `a` and `b`; the generator PRNG tuple is `(puzzleVersion, difficulty, seed, candidateIndex)`. Because the game is unpublished, no compatibility adapter or old query surface is retained.
- Give the daily contract its own v1 namespace. Taiwan's fixed GMT+8 offset maps a timestamp to `YYYY-MM-DD`, and each stage seed is `twain-daily:v1:<date>:<difficulty>`. This separates date/persistence compatibility from puzzle schema compatibility.
- Use the fixed sequence Easy 5×5, Medium 6×6, Hard 7×7, Extra 8×8, Ultra 10×10. The former 10×10 tuning becomes Ultra unchanged in purpose; a six-candidate 8×8 profile fills the large solver-effort gap between Hard and Ultra.
- Generate only the active stage. Eagerly generating all five would make the initial page pay Ultra's bounded-search cost even though most users have not reached it. Continue performs synchronous generation while the timer is already paused.
- Persist the current stage, paths, active line, Undo history, counters, and elapsed time in `twain:daily:v1`. Regenerate the puzzle from the date/stage and replay stored paths/history through pure game rules before accepting them. Do not trust stored completion flags.
- Treat localStorage as continuity, not an account. Reload restores the accumulated time and current board paused; the next valid move or Hint resumes. This avoids charging time while the page was closed. A running open tab still measures elapsed wall time through the browser's monotonic clock.
- Make progress strictly sequential and noninteractive. A completed intermediate stage pauses time and offers one Continue action; Ultra ends the run with no Replay/New escape hatch. Clear affects only the current board and never completed stages or elapsed daily time.
- Strip query and fragment state and rename the header action to **Share today**. The canonical URL is reproducible because date and deployed code derive the same internal seeds, not because arbitrary seed/difficulty parameters are public.
- Reject a server clock, accounts, and cross-device sync. They would violate the static/no-runtime-service boundary for a prototype whose accepted persistence scope is one browser. Also remove the generator's unused random-default seed helper so production generation must receive an explicit daily seed.

## Outcome

- Twain is now the only game. All runtime, validator, tests, copy, docs, and procedure branches for the removed mode are gone.
- A Taiwan date deterministically owns five boards ordered Easy → Medium → Hard → Extra → Ultra. The UI exposes `[daily timer] [five-segment Today progress] [Clear]` above the board and no mode, difficulty, or New control.
- One timer spans the run, pauses between stages, resumes on the first valid move/Hint, and stops after Ultra. Clear preserves its running/paused state; reload restores it paused.
- Daily play survives reload in the same browser. Stale, malformed, wrong-seed, and illegal persisted records reset safely to today's Easy board.
- The board set and palette are identical for users on the same Taiwan date and deployed version. Share today copies a canonical query-free URL.
- Puzzle version 4 defines five Twain-only profiles. On the fixed ten-seed calibration cohort, median solver scores are approximately `44 → 109 → 552 → 1,081 → 8,045`; Extra sits between Hard and Ultra without treating clue count as difficulty by itself.
- Completion automatically scrolls only enough to expose the transition card. This was added after pixel inspection showed that a desktop player could otherwise finish with Continue just below the fold.

## Trade-offs and consequences

The daily date trusts the device clock. A wrong or deliberately changed clock can choose another run; an authoritative date would require a service or another external trust source. Browser-local persistence does not synchronize devices or private/browser profiles. A continuously visible tab is not polled solely for midnight rollover, but reload and visibility restoration do switch dates.

Ultra generation remains synchronous. Lazy generation protects initial load and its transition occurs while timing is paused, but low-end physical-device latency still needs measurement. The 10×10 finale remains a roughly two-minute human target rather than a promise; solver score only supplies reproducible ordering.

Reload intentionally pauses rather than silently resuming. This makes elapsed time understandable and prevents charging absence, at the cost of allowing a player to pause by reloading. Competitive integrity, streaks, and leaderboards are outside the current single-player prototype.

## Verification

- `npm test`: 49/49 tests pass. Coverage includes GMT+8 rollover, daily seed/order contracts, persistence round trips and rejection, solved-Ultra restore, Twain rules, all five generator profiles, property cohorts, solver calibration, palette contrast, static daily-only chrome, and deployment imports.
- The fixed calibration cohort produced medians `44`, `109`, `552`, `1,081`, and `8,045`; current median generation measurements were roughly 9 ms, 16 ms, 58 ms, 121 ms, and 417 ms on the development machine.
- `npm run visual-qa`: 22 browser checks pass in Microsoft Edge with no runtime or console errors. The harness completed all five stages, verified timer pauses/resumes, Clear, canonical sharing, reload/current-path restore, final restore, pointer/touch/keyboard behavior, Ultra touch, and 1440×1000, 768×1024, 390×844, and 320×800 layouts.
- Fourteen first-pass captures were opened at original resolution. Easy/Ultra fresh states, invalid/backtracking/Hint states, paused Medium, intermediate/final completion, both mobile widths, tablet, and reduced motion were inspected. The completion-discoverability issue was fixed, the full harness was rerun, and the affected intermediate/final captures were reinspected.
- Every maintained fresh/paused board remained square and above the fold; multi-glyph clues stayed within their shapes and retained the Number line optical correction. `git diff --check` passes. Temporary screenshots remain outside the repository.

## Follow-ups

- Validate all five human difficulty bands and Ultra's roughly two-minute target with a broader cohort.
- Measure the Ultra transition on low-end physical phones.
- Decide whether trusting the device clock remains acceptable before public launch.
- Complete the existing physical iOS, visual-regression, short-landscape, and accessibility checks recorded in `BACKLOG.md`.
