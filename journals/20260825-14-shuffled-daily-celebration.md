---
date: 2026-08-25
sequence: 14
topic: shuffled-daily-celebration
supersedes:
  - "20260825-06-unified-subtitle-style.md"
  - "20260825-13-daily-twain-run.md"
---

# Vary the daily run and celebrate completion on the board

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The first daily version always presented five levels from Easy through Ultra and placed its date and stage/grid/wall metadata between the toolbar and board. Completion appeared in a separate card below the controls. The next design direction asked for a lighter header and progress treatment, no board metadata or visible status area, a more surprising daily selection, and a celebratory transition directly over the solved board.

A separate request proposed retroactively changing every Git commit timestamp. Git history was deliberately left untouched: changing provenance after the fact would make the record inaccurate and replace every affected commit hash. This UI/daily change remains ordinary uncommitted work until a later explicit commit request.

## Decision process

- Advance the independent daily contract from v1 to v2 while leaving puzzle schema v4 unchanged. The generator did not change, but schedule, seed namespace, and persistence compatibility did.
- Hash `twain-daily:v2:<Taiwan date>:schedule` into a deterministic PRNG. Draw a stage count from three through five, Fisher–Yates shuffle the five-profile catalog, then take that many profiles without replacement. This preserves same-date equality across browsers without retaining a predictable difficulty arc.
- Derive the schedule instead of storing or trusting it. Persist only the current stage index and play state; restore rejects old v1 records, out-of-schedule stages, and illegal paths. The first v2 visit therefore starts fresh.
- Keep sequential unlocking inside the sampled order. One timer still spans the run and pauses between stages; the final selected level, not necessarily Ultra, ends the day.
- Replace the centered header subtitle with `Mon D` date copy and omit the visible timezone suffix. The subtitle remains Twain's metadata/tagline rather than play chrome.
- Remove the **Today** progress eyebrow and create three to five progress segments dynamically. The progress copy is the only visible level metadata; grid size and wall count disappear.
- Put completion inside the board stage as a full-board warm translucent veil with a centered congratulatory panel. Intermediate overlays name the cleared level and offer **Continue to <next level>**; the final overlay retains **The twain never met.** with total time and Hint count.
- Add a brief veil fade, spring-like panel entrance, and route-colored confetti burst. `prefers-reduced-motion` collapses all timings through the existing global motion rule.
- Remove the layout-level status element. Keep one visually hidden `aria-live` announcer so invalid moves, Hint, sharing, and completion still have nonvisual feedback.

## Outcome

Daily Twain now varies both length and order while remaining reproducible. The 2026-08-29 QA date resolves to `Easy → Ultra → Hard → Medium → Extra`; the August test cohort exercises all three allowed run lengths and confirms unique profiles within each schedule.

The header is now brand / date / Share today. The game card moves directly from timer/progress/Clear to the square board, and no longer displays strings such as `Ultra · 10×10 · 18 walls`. Finishing a level keeps the solved routes visible under an animated overlay instead of moving attention below Hint.

The Visual QA harness now understands dynamic schedules, validates overlay/board bounds and animation names, captures completion at desktop, 390px, and 320px, and waits for spawned browser/server processes to exit before removing their temporary profiles.

## Trade-offs and consequences

Sampling without replacement maximizes daily variety but removes the previous onboarding-to-finale arc. Ultra can be the first level, and days may differ substantially in total effort. Human dropout and daily-time variance are now explicit playtest questions.

An Ultra opening can also make its synchronous generation cost part of initial load rather than a paused transition. Low-end physical-phone measurement now covers both positions. Resetting v1 progress is accepted because the product remains unpublished and a compatibility adapter would preserve a contract that no longer exists.

The completion animation may replay when a completed stage is restored after reload. That is acceptable for the current prototype: persisted completion still needs an obvious next action, and adding one-time animation bookkeeping would expand state for little value.

## Verification

- `npm test`: 49/49 tests pass. Daily coverage fixes the v2 schedule for 2026-08-29, proves deterministic unique 3–5 stage schedules across an August cohort, validates the v2 seed namespace, rejects v1 persistence, and restores a completed three-stage day correctly.
- `npm run visual-qa`: the final Microsoft Edge run exits cleanly with 24 browser checks, 15 screenshots, and no runtime/console errors. It completes the shuffled five-profile QA schedule, verifies persistence/timer/input behavior, checks the board overlay and celebration animations, and covers 1440×1000, 768×1024, 390×844, 320×800, touch, and reduced motion.
- Every unique rendered state was inspected at original resolution: the initial 13-state pass plus added 390px and 320px completion overlays. The overlay remained within the board, its copy and Continue action fit at both narrow widths, the removed metadata left no visual gap, and the header date/progress hierarchy stayed balanced.
- A teardown-only rerun initially exposed an `ENOTEMPTY` race while deleting Chromium's profile. Waiting for browser/server exit and using bounded removal retries fixed the harness; the final run exits zero. Runtime and harness syntax checks plus `git diff --check` pass.

## Follow-ups

- Validate shuffled-order onboarding and variable run length with humans, especially Ultra-first days.
- Measure Ultra as both initial load and paused transition on low-end phones.
- Complete the existing physical iOS, visual-regression, short-landscape, clock-trust, and accessibility work in `BACKLOG.md`.
