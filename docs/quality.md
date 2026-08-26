# Quality Contract

## Automated checks

Run:

```sh
npm test
npm run visual-qa
```

Coverage targets:

- Taiwan GMT+8 rollover at 16:00 UTC, exact next-boundary duration, launch-relative public numbering across month/leap-day boundaries, deterministic three-to-five-level sampling, uniqueness, and shuffle order across date cohorts.
- Stable, unique, versioned daily seeds for every `(date, difficulty)` pair.
- Puzzle determinism for identical difficulty and seed; no product mode field.
- Validator acceptance across many seeds and all five profiles.
- Bounded-solver correctness, witness independence, deterministic limits, and strictly increasing median cohort scores through Ultra.
- Generated witnesses are balanced, disjoint, exhaustive, and playable through the same pure rules as user input.
- Independent clue order, clue ownership, shared-cell rejection, early line completion, immediate-predecessor backtracking, older-body rejection, global Undo, and Hint correction.
- Acceptance of valid full-board partitions whose line lengths differ from the witnesses.
- localStorage records round-trip paths, history, counters, elapsed time, and additive stage telemetry baselines; stale-version/malformed/illegal records are rejected; legacy v2 records omit unknown stage deltas; a solved final selected stage restores as a finished daily run.
- Streak records validate current/longest/total invariants and exercise consecutive, missed, repeated, backward-clock, pre-launch, and malformed completion cases.
- Analytics tests lock the approved production stream and debug-off setting, enforce configuration/consent initialization gates, versioned timestamped consent validation, one lazy Google tag, privacy-limited configuration/revocation, bounded GA-compatible scalar events, and the absence of paths, seeds, or identifiers from Twain event builders.
- All seven locale catalogs implement the same message contract; BCP 47 matching covers Chinese scripts/regions and regional language variants; explicit locale overrides win; localized dates preserve the calendar day; invalid dates/counters are rejected.
- Finished-result copy localizes numbered/unnumbered identity plus zero, singular, and plural Hint counts.
- Static discovery tests enforce the canonical URL, required and structured Open Graph properties, matching large-card metadata, English crawler copy, standalone manifest contract, icon declarations, and exact opaque 1200×630/180×180/192×192/512×512 PNG dimensions.
- The QR adapter deterministically produces square matrices, three intact finder patterns, a four-module quiet zone, and content-dependent SVG paths for the canonical URL.
- Deterministic seed-to-palette selection with a maintained contrast floor.
- Static deployment remains relative, daily-only, free of query-controlled puzzle selection, and free of package-manager/CDN dependencies; the pinned QR source/license remains present, and the optional remote Google tag must remain absent from static HTML and unreachable without valid configuration plus explicit consent.

Tests use Node's built-in runner and remain network-independent.

GitHub Actions runs the `Test` job for pull requests into and pushes to `master`. Only a successful non-pull-request run on `master` can start `Deploy Pages`; Pages and OIDC write permissions belong only to that deployment job. Rendered Visual QA remains a maintainer release gate rather than an automated pull-request check until browser provisioning is committed in CI.

## Rendered Visual QA

The project harness controls a locally installed Chromium browser through the Chrome DevTools Protocol without a package dependency. It serves the repository under a nested project path and fixes the clock to Taiwan date `2026-08-29`, whose v2 schedule is `Easy → Ultra → Hard → Medium → Extra`.

It verifies:

- the versioned OG image, its real pre-launch 23-of-25-cell dual-path source state, canonical social metadata, Apple touch icon, and both maskable manifest icons load at their exact dimensions through the nested Pages path; the near-complete board stops both routes before their final clues, sampled OG pixels prove the raster is nonblank, and the manifest parses with standalone display and relative launch state;
- canonical date-driven URL, deterministic same-date DOM board, numbered header identity, and next-day number rollover;
- all five profiles in a noncanonical shuffled schedule, lazy transitions, dynamic progress segments, shared timer pause/resume, current-board Clear, final daily restore, live countdown, and automatic zero-boundary rollover;
- pointer, touch, keyboard, line selection/fading, backtracking/body rejection, Undo, still-board invalid input, Hint, and both Share entries: an in-app numbered header dialog whose canonical URL matches its black-on-white QR, Hint-aware finished-result payload, result-only direct transient activation, `canShare()` preflight, native Promise/non-Promise/rejection/cancellation behavior, secure Clipboard, insecure-context selected-text copy, visible copied feedback, and manual-copy fallback;
- rightmost globe placement, Automatic plus seven locale autonyms, radio/keyboard menu behavior, browser-locale auto selection, explicit override persistence/reload/removal, all seven integrated UI locales, localized Traditional Chinese tutorial/Share dialogs, and 320px Brazilian Portuguese long-copy containment;
- initial privacy banner layout at 1440×1000, 768×1024, 390×844, and 320×800; localized details modal and Help re-entry; direct accept/decline persistence; no pre-consent or declined Google tag/data layer/request; configured-tag initialization only after a grant; clean tag-free reload after active revocation; and streak creation only after restored or newly solved full-daily completion;
- clue geometry, multi-glyph containment/alignment, palette contrast, black numbered header identity, orange current-progress accent, loaded square two-stroke logo, full mobile wordmark, persistent mobile timer icon, black Help control, modal tutorial, board focus, and both concise animated completion overlays at desktop, 390px, and 320px, including one 16-particle intermediate wave plus three distinct 16-particle daily-finale waves, all emitted from eight perimeter sectors on unique gravity-driven trajectories;
- Easy and 10×10 Ultra at 1440×1000, 768×1024, 390×844, and 320×800;
- double-tap/long-press suppression, reduced motion, nested-path module loading, and runtime/console errors.

The harness produces screenshots and assertions; it does not judge pixels. Open every relevant capture and evaluate it against [design.md](design.md).

## Manual browser matrix

| Surface | Checks |
| --- | --- |
| Desktop pointer | daily toolbar order, click/drag, line selection/fading, backtracking/body rejection, timer-preserving Clear, Undo, Hint, on-board Next level, Help dialog and Privacy choices, initial privacy bar, Language menu, header QR/link dialog and Copy, result system Share/fallback |
| Mobile touch | crisp two-stroke logo and full header wordmark, visible timer icon, Help/Share/Language order, localized date separation, privacy bar/details containment and underlying-control reachability, Language/Help/header Share containment, QR scanning and URL long-press selection, no page scroll while drawing, double-tap/long-press policy outside copy fields, cells reachable, toolbar/progress unclipped, Ultra touch and Clear |
| Keyboard | focus board, N/L, arrows, Enter, Backspace, H, R, Language-menu Up/Down/Home/End/Escape/Tab, no blue board outline |
| Localization | seven explicit locales, Automatic browser matching, override reload/removal, localized metadata/date/ARIA/tutorial/privacy/progress/completion/share copy, longest strings at maintained widths |
| Privacy/analytics | undecided/declined/granted persistence, no pre-consent or declined tag request, details and withdrawal path, clean reload after active revocation, GA DebugView validation before considering the rollout complete |
| Discovery/install | inspect the 1200×630 social card and 180px Home Screen icon; verify OG/Twitter fields, manifest parse, nested-path asset loads, icon masking, Add to Home Screen name, and standalone launch on a physical device |
| Daily lifecycle | same-date deterministic schedule/boards, 3–5 unique shuffled levels, sequential unlock within that schedule, pause between stages, reload restore paused, final result restore/share/countdown, new date on reload/visibility/countdown zero |
| Responsive | maintained four viewports; Easy and Ultra square/above-fold; multi-glyph clue containment and optical alignment |
| Preferences | reduced motion and high-contrast control focus |
| Deployment | nested GitHub Pages path loads every imported module |

The harness proves that header Share does not call `navigator.share()`, that its rendered QR and visible link derive from the same canonical URL, and that a real result-Share click reaches `navigator.share()` while transient activation is active. It also proves that discovery/install assets parse and load, but it cannot render an actual social platform card, SpringBoard mask, Add to Home Screen sheet, or standalone iOS launch. Those device/platform-owned surfaces still require physical checks.

## Release gate

- `npm test` passes.
- `npm run visual-qa` passes and every relevant screenshot is inspected, or the journal names the precise rendered-browser gap.
- A local HTTP server returns `index.html`, `manifest.webmanifest`, discovery/install images, `styles.css`, every imported module, and the pinned QR encoder.
- Generated puzzles log no validator, runtime, or browser-console errors.
- Semantic docs, backlog, procedure, and exactly one new journal agree with the implementation.

## Current automation gap

There is no committed pixel baseline or CI browser provisioning. Chromium emulation also cannot establish physical Safari typography/callout behavior, SpringBoard icon masking, Add to Home Screen naming/launch behavior, social-platform crawler rendering, human difficulty, or low-end device latency. These remain explicit backlog items rather than claims made by automated checks.
