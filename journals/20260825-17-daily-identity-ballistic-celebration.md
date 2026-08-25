---
date: 2026-08-25
sequence: 17
topic: daily-identity-ballistic-celebration
supersedes:
  - "20260825-14-shuffled-daily-celebration.md"
  - "20260825-15-header-help-share.md"
---

# Finish the daily identity and give celebrations ballistic motion

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The shuffled daily run and compact header were functionally complete, but Twain still used a generic temporary mark and its celebration particles moved along slow, straight-looking tracks. The final overlay also needed to become a durable end-of-day result with native sharing and a live countdown, while intermediate completion needed the same visual energy without overpowering the next-level action.

## Decision process

- Explore a two-route `T` mark with image generation, then redraw the selected geometry as a code-native SVG. The generated bitmap's glow became muddy at the 28px header size; two crisp, separated cyan and orange strokes preserve the concept and the game's no-crossing rule at favicon scale.
- Use the same SVG for the favicon and visible header mark, with the full **Twain** wordmark retained at all maintained widths.
- Keep the compact header contract from the previous iteration: accented date in the center, circular Help and native Share actions on the right, and guidance inside a responsive native dialog.
- Keep intermediate completion concise: **Nicely done!**, cumulative Hint count, and **Next level**. Make the final result distinct with **Well played!**, total time, Hint count, a live `Come back in hh:mm:ss` countdown, and a Share result action. Restoring a completed date recreates this final overlay and continues the countdown.
- Generate celebration particles in JavaScript from a deterministic animation-only seed. Each particle varies its perimeter origin, angle, velocity, gravity, horizontal drift, spin, size, shape, color, delay, and duration while leaving puzzle determinism untouched.
- Sample a ballistic path at 25%, 50%, 75%, and 100% using horizontal launch plus drift and vertical launch plus gravity. Durations stay between 420ms and 560ms so the pieces read as energetic throws rather than slow translations.
- Launch one 16-particle wave for an intermediate stage and three independently generated 16-particle waves for the daily finale. Finale waves start 560ms apart and draw from eight perimeter sectors, extending the celebration by adding throws instead of slowing particles or repeating fixed origins.
- Collapse particle and panel motion under `prefers-reduced-motion`, preserving the overlay, copy, and actions without decorative movement.
- Teach rendered QA to pause only the confetti Web Animations at deterministic instants after the overlay has settled. This makes all three finale waves inspectable without capturing stale or mid-layout states.

## Outcome

Twain now has a compact original mark whose two disconnected routes form a `T`. The same branded header, tutorial, canonical sharing behavior, concise stage transition, restored final result, total time, Hint count, and midnight countdown work across desktop and iPhone widths.

Both completion states now use the same gravity-driven celebration vocabulary. Intermediate completion gives one quick burst; the daily finale throws three visually distinct waves from around the board. The particles accelerate downward, leave the screen quickly, and vary enough to feel naturally projected rather than copied along straight tracks.

## Trade-offs and consequences

The ballistic positions are sampled CSS keyframes rather than a per-frame physics loop. Four checkpoints are sufficient at the current sub-600ms duration, avoid a runtime animation loop, and keep the implementation dependency-free, but they are an approximation rather than continuous simulation.

Confetti randomness is seeded for reproducible QA. It looks irregular to players while allowing trajectory and wave assertions to remain stable. The seed is deliberately namespaced outside puzzle generation, so visual changes do not alter a day's boards.

The generated bitmap remains an uncommitted design exploration. Shipping the redrawn SVG avoids raster blur and unnecessary asset weight while retaining the selected two-line concept.

## Verification

- `npm test`: 49/49 tests pass, including deterministic daily schedules, persistence and completed-run restoration, generated-puzzle invariants, interaction rules, route palette contrast, and static UI/asset regressions.
- `npm run visual-qa`: Microsoft Edge exits cleanly with 28 browser checks, 21 screenshots, and no runtime or console errors. The harness verifies 16 intermediate and 48 finale particles, eight perimeter sectors, three unique finale waves, single-iteration particles, 420–560ms durations, increasing vertical displacement increments, result restoration, countdown, both sharing branches, tutorial behavior, and the full daily/input matrix.
- Every screenshot from `/var/folders/z1/glf5lcnj2hq2_mwn6jdtzfz00000gn/T/twain-visual-qa-2026-08-25T15-26-02-464Z` was inspected at original resolution across 1440×1000, 768×1024, 390×844, and 320×800. Copy and actions remain legible through all celebration waves; the board, header, tutorial, and overlays stay contained; reduced motion shows no decorative animation.
- The generated bitmap concept was reviewed at full size and rejected for production because its glow lost definition in the header. The final SVG was inspected in the rendered desktop and mobile captures and stays distinct at its smallest maintained size.
- `node --check src/main.js`, `node --check .agents/skills/visual-qa/scripts/run.mjs`, and `git diff --check` pass.

## Follow-ups

- Complete the existing physical-iOS, visual-regression, short-landscape, clock-trust, and accessibility work recorded in `BACKLOG.md` before publication.
