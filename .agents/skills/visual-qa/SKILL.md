---
name: visual-qa
description: Run Twain's rendered visual feedback loop—capture real browser states, judge them against the design contract, fix defects, and recapture. Use for every change that alters pixels, layout, copy, responsive behavior, or user interaction.
---

# Visual QA

A successful build does not prove a successful interface. Verify user-visible work by looking at rendered pixels and exercising the affected interaction states.

## Contract and setup

Read `docs/design.md` and the browser matrix in `docs/quality.md`. Run the project-owned, dependency-free browser harness:

```sh
npm run visual-qa
```

It detects Microsoft Edge, Google Chrome, or Chromium, serves the repository under a nested project path, fixes the browser clock to Taiwan date `2026-08-29` (Twain #4), seeds an explicit session-scoped declined analytics preference for ordinary regression states, and writes screenshots plus `summary.json` to a fresh OS temporary directory. Set `TWAIN_BROWSER_PATH` to an executable when automatic detection is insufficient. Use `npm run visual-qa -- --output /absolute/temp/path` only when a stable temporary location is useful.

The harness covers a deterministic sampled-and-shuffled five-stage date (`Easy → Ultra → Hard → Medium → Extra`) so one run exercises every profile without implying canonical order. It verifies the canonical URL, versioned nonblank 1200×630 OG art and social metadata, a dedicated real 23-of-25-cell near-complete dual-path capture from the pre-launch date `2026-08-12`, Apple touch icon, maskable standalone manifest assets under the nested Pages path, same-date boards, localStorage reload/finished-run restore, full-run-only streak persistence, shared timer pause/resume, current-board Clear, distinct intermediate/final animated overlays with one versus three quick seeded waves, eight-direction perimeter origins, unique gravity-driven trajectories, numbered and Hint-aware localized finished-time sharing, live next-day countdown and number rollover, 10×10 Ultra rendering/touch input, dynamic daily progress, the loaded square two-stroke logo, black numbered localized header identity, mobile wordmark/timer icon, Help/Share/Language order without overlap, the rightmost globe menu's keyboard behavior, all seven explicit UI locales, browser-locale Automatic selection, persisted override/removal, 320px Brazilian Portuguese containment, black Help control, localized modal tutorial, the localized in-app header QR/link dialog at all four maintained viewports, initial privacy banner and Enhanced Measurement details at all four maintained viewports, Portuguese privacy details at 320px, privacy Help re-entry, persistent grant, session-only decline across reload, simulated next-session re-prompt, production tag initialization only after consent, and tag-free reload after revocation. Analytics requests are intercepted and fulfilled locally so QA proves the request boundary without sending test traffic to GA. The harness also verifies QR quiet-zone/URL agreement, secure, insecure-context, and manual-copy behavior, result-only direct-activation Web Share and fallbacks, clue containment/alignment, seed-selected contrast palettes, line selection/fading, pointer, touch, keyboard, double-tap zoom and long-press suppression, orthogonal click drawing, direct click rewind with one-action Undo, cell-by-cell tail-first drag backtracking, quiet non-predecessor body collisions during drag, still-board invalid input, Hint correction, focus, reduced motion, runtime errors, and the required responsive widths. Unit coverage proves that other dates deterministically select three or four unique levels and that analytics obeys its consent/configuration gates. The harness proves behavior and produces rendered evidence; it does not judge the pixels. Open and inspect every relevant capture before accepting the run.

For the checked-in release footer, verify its `v{yymmdd}r{rev}` shape, subtle styling, containment below the game card, and lack of overlap with play or the fixed privacy bar at every maintained viewport.

Use the agent's supported interactive browser surface for exploratory or narrowly targeted checks when available. Keep captures temporary and outside the repository unless the user explicitly asks for committed artifacts.

If no supported rendered-browser surface is available, do not substitute source inspection or HTTP status checks and call it Visual QA. Run the nonvisual checks that remain possible, record the missing visual verification in the change journal, and report the gap.

## Capture → judge → fix → recapture

1. **Choose coverage.** Identify the pages, states, inputs, and breakpoints affected. For broad UI changes, cover at least 1440×1000, 768×1024, 390×844, and 320×800.
2. **Render real states.** Capture the fresh board and every affected state: privacy banner/details, drawing, invalid move, hint correction, stage transition, daily completion, disabled controls, focus, or reduced motion as applicable. Use the harness's fixed Taiwan date and stage when comparing iterations.
3. **Inspect the screenshots.** Actually open each image. Judge it against `docs/design.md`: hierarchy, logo clarity at rendered size, route/grid/wall geometry, spacing rhythm, clue legibility, state contrast, overflow, focus, content coherence, and whether the board remains dominant.
4. **Exercise behavior.** Check pointer drawing, orthogonal click/tap drawing, direct path-click rewind, cell-by-cell tail-first drag backtracking, quiet non-predecessor body collisions, Undo, keyboard operation, and affected mobile gesture policies. Capture is visual evidence, not a replacement for functional assertions.
5. **Fix root causes.** Correct the smallest underlying layout, style, rendering, content, or harness defect. Do not change the design contract merely to excuse an unintended result.
6. **Recapture narrowly.** Re-run the affected states and viewports. Compare the new pixels with the previous iteration.
7. **Repeat until clean.** Stop only when no known defect remains in the affected matrix and the automated gates are green.

Treat a screenshot stuck on loading, missing fonts, stale assets, or leaked hover state as a capture-harness problem until proven to be an application defect. Fix the loop and recapture; do not judge invalid evidence.

## Intended visual-language changes

When the change intentionally alters visual language, update `docs/design.md` in the same change. The written contract and rendered pixels must converge; neither silently overrides the other.

## Checkpoint evidence

Record in the new journal:

- viewports and states inspected;
- defects found and their root-cause fixes;
- final result of the recapture;
- any state that could not be verified and why.

Do not commit temporary screenshots by default.
