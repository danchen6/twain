---
date: 2026-08-26
sequence: 07
topic: near-complete-social-board
supersedes:
  - 20260826-06-social-preview-home-screen.md
---

# Show both Twain paths near completion without spoiling a daily puzzle

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The initial social card in `20260826-06-social-preview-home-screen.md` used a fresh board. Its composition, headline, and overall App Store-style hierarchy were accepted, but an empty board did not show Twain's defining visual idea: two independent paths advancing through the same board. The requested refinement was a near-complete play state with both lines visible at once.

## Decision process

The artwork continues to use real browser-rendered gameplay rather than manually drawn routes. The selected state draws each constructive witness up to—but not including—its final clue: 14 cells on one line and 9 on the other, for 23 of 25 cells occupied. This leaves two adjacent destination cells open, keeps the completion overlay hidden, and communicates “almost solved” without presenting a finished result. The natural inactive-line fade remains intact; overriding it only for marketing art was rejected because the authentic state stays legible at feed size.

The first provisional capture used the harness's normal future date, `2026-08-29` (Twain #4). That would have exposed 23 cells of a forthcoming daily solution, so it was rejected before checkpoint. The repeatable social-art capture now uses `2026-08-12`, before the numbered public run began and unreachable through Twain's daily-only UI. It still passes through the production generator, renderer, and legal pointer-move path, but cannot spoil a playable numbered puzzle. Its orange/cyan palette also aligns with the Twain mark and existing generated background.

A color-profile post-process was also rejected after direct inspection showed that `sips --optimizeColorForSharing` could turn the rendered 1200×630 screenshot into a visually blank PNG while preserving valid dimensions. The final file is the headless browser's native opaque 8-bit RGB PNG. The browser harness now samples rendered OG pixels for color diversity and dark content, so a dimensionally valid blank regression fails automatically.

## Outcome

- Replaced the fresh board crop and final `twain-og-v1.png` pixels with the spoiler-safe 23-of-25-cell dual-path state while preserving the accepted card layout, headline, caption, and background.
- Updated Open Graph and large-card alt text to describe a nearly completed two-line board.
- Added a deterministic pre-launch social-art state to Visual QA, including legal path-length, incomplete-state, and nonblank-raster assertions.
- Updated product, design, architecture, quality, and procedural memory to require near-complete dual-path art from a non-playable source board.

## Trade-offs and consequences

- The image intentionally reveals most of one generated board's routes to explain gameplay quickly, but that board predates Twain #1 and cannot appear in the current daily-only product.
- One line uses the real 45% inactive opacity. This is less symmetrical than marketing-only full-opacity routes, but both paths remain distinct at 600×315 and the image does not misrepresent interaction feedback.
- The source capture date is a Visual QA authoring detail, not a new archive, custom-date mode, runtime query contract, or player-visible feature.

## Verification

- `npm test`: 67/67 tests passed.
- `node --check .agents/skills/visual-qa/scripts/run.mjs` and `node --check tests/metadata.test.js`: passed.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-og-final`: 39 browser checks passed with 36 captures and no runtime or console errors. The run proved the pre-launch 14/9-cell route prefixes, 23/25 occupancy, hidden completion state, exact asset dimensions, and nonblank OG pixel samples.
- Inspected the real 1440×1000 pre-launch near-complete state, its exact 604×604 crop, the final opaque RGB 1200×630 PNG, and a 600×315 feed-size reduction. Both orange and cyan paths, both unmet final clues, copy hierarchy, and board geometry remained clear.
- `git diff --check`: clean.

## Follow-ups

The physical social-platform crawler check already recorded in `BACKLOG.md` remains the release gate; this refinement adds no new deferred work.
