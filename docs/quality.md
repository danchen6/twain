# Quality Contract

## Automated checks

Run:

```sh
npm test
npm run visual-qa
```

Coverage targets:

- Taiwan GMT+8 rollover at 16:00 UTC, exact next-boundary duration, deterministic three-to-five-level sampling, uniqueness, and shuffle order across date cohorts.
- Stable, unique, versioned daily seeds for every `(date, difficulty)` pair.
- Puzzle determinism for identical difficulty and seed; no product mode field.
- Validator acceptance across many seeds and all five profiles.
- Bounded-solver correctness, witness independence, deterministic limits, and strictly increasing median cohort scores through Ultra.
- Generated witnesses are balanced, disjoint, exhaustive, and playable through the same pure rules as user input.
- Independent clue order, clue ownership, shared-cell rejection, early line completion, immediate-predecessor backtracking, older-body rejection, global Undo, and Hint correction.
- Acceptance of valid full-board partitions whose line lengths differ from the witnesses.
- localStorage records round-trip paths, history, counters, and elapsed time; stale-version/malformed/illegal records are rejected; a solved final selected stage restores as a finished daily run.
- Deterministic seed-to-palette selection with a maintained contrast floor.
- Static deployment remains relative, dependency-free, daily-only, and free of query-controlled puzzle selection.

Tests use Node's built-in runner and remain network-independent.

GitHub Actions runs the `Test` job for pull requests into and pushes to `master`. Only a successful non-pull-request run on `master` can start `Deploy Pages`; Pages and OIDC write permissions belong only to that deployment job. Rendered Visual QA remains a maintainer release gate rather than an automated pull-request check until browser provisioning is committed in CI.

## Rendered Visual QA

The project harness controls a locally installed Chromium browser through the Chrome DevTools Protocol without a package dependency. It serves the repository under a nested project path and fixes the clock to Taiwan date `2026-08-29`, whose v2 schedule is `Easy → Ultra → Hard → Medium → Extra`.

It verifies:

- canonical date-driven URL and deterministic same-date DOM board;
- all five profiles in a noncanonical shuffled schedule, lazy transitions, dynamic progress segments, shared timer pause/resume, current-board Clear, final daily restore, live countdown, and automatic zero-boundary rollover;
- pointer, touch, keyboard, line selection/fading, backtracking/body rejection, Undo, still-board invalid input, Hint, and both Share entries: direct transient activation, `canShare()` preflight, native Promise/non-Promise/rejection/cancellation behavior, secure Clipboard, insecure-context selected-text copy, visible copied feedback, and manual-copy fallback;
- clue geometry, multi-glyph containment/alignment, palette contrast, theme-accent parity, loaded square two-stroke logo, full mobile wordmark, persistent mobile timer icon, black Help control, modal tutorial, board focus, and both concise animated completion overlays at desktop, 390px, and 320px, including one 16-particle intermediate wave plus three distinct 16-particle daily-finale waves, all emitted from eight perimeter sectors on unique gravity-driven trajectories;
- Easy and 10×10 Ultra at 1440×1000, 768×1024, 390×844, and 320×800;
- double-tap/long-press suppression, reduced motion, nested-path module loading, and runtime/console errors.

The harness produces screenshots and assertions; it does not judge pixels. Open every relevant capture and evaluate it against [design.md](design.md).

## Manual browser matrix

| Surface | Checks |
| --- | --- |
| Desktop pointer | daily toolbar order, click/drag, line selection/fading, backtracking/body rejection, timer-preserving Clear, Undo, Hint, on-board Next level, Help dialog, system Share/clipboard fallback |
| Mobile touch | crisp two-stroke logo and full header wordmark, visible timer icon, black Help control, Help dialog containment, no page scroll while drawing, double-tap/long-press policy, cells reachable, toolbar/progress unclipped, Ultra touch and Clear |
| Keyboard | focus board, N/L, arrows, Enter, Backspace, H, R, no blue board outline |
| Daily lifecycle | same-date deterministic schedule/boards, 3–5 unique shuffled levels, sequential unlock within that schedule, pause between stages, reload restore paused, final result restore/share/countdown, new date on reload/visibility/countdown zero |
| Responsive | maintained four viewports; Easy and Ultra square/above-fold; multi-glyph clue containment and optical alignment |
| Preferences | reduced motion and high-contrast control focus |
| Deployment | nested GitHub Pages path loads every imported module |

The harness can prove that a real click reaches `navigator.share()` while transient activation is active and can exercise every application-owned fallback. It cannot inspect the operating-system share sheet itself; that final native surface still requires a physical iOS check.

## Release gate

- `npm test` passes.
- `npm run visual-qa` passes and every relevant screenshot is inspected, or the journal names the precise rendered-browser gap.
- A local HTTP server returns `index.html`, `styles.css`, and every imported module.
- Generated puzzles log no validator, runtime, or browser-console errors.
- Semantic docs, backlog, procedure, and exactly one new journal agree with the implementation.

## Current automation gap

There is no committed pixel baseline or CI browser provisioning. Chromium emulation also cannot establish physical Safari typography/callout behavior, human difficulty, or low-end device latency. These remain explicit backlog items rather than claims made by automated checks.
