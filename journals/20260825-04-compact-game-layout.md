---
date: 2026-08-25
sequence: 4
topic: compact-game-layout
supersedes: ["20260825-03-square-board-visuals.md"]
---

# Put the board first in a compact game layout

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The square-board pass improved Twain's geometry, but the separate hero, explanatory copy, visible status/progress panel, and footer still pushed the board down and diluted the play-first hierarchy. The compact clue labels also remained too small. Clearing a route restarted the timer even though Clear is a correction inside the same attempt.

This supersedes the earlier conclusion that the subtitle begins a hero hierarchy and extends its equal-size clue-label decision: the subtitle now belongs to the header, and the equally sized A/B prefix and number are substantially larger and more tightly paired. The square board, square Line B clues, and no-outline focus treatment from the earlier entry remain current.

## Decision process

- Move **Never the twain shall meet** into the product header and remove the standalone hero and explanatory paragraph. This saves vertical space without hiding any rule needed to play; the collapsible How-to remains available.
- Remove the visible status/progress panel and footer. A visually hidden `aria-live` status remains so invalid moves, hints, and copy-link results still reach assistive technology. Occupancy is still enforced by completion logic but is no longer displayed as a quota.
- Increase Twain clue type from `clamp(0.7rem, 2.85vw, 1.05rem)` to `clamp(1.05rem, 4.3vw, 1.6rem)`, which is at least 150% at every clamp boundary. Use zero flex gap plus a small negative end margin on the A/B prefix to tighten the two glyphs without changing their equal computed size.
- Treat Clear as part of one timed attempt: it removes both paths and history while the current timer continues. Replay and New remain explicit fresh attempts and reset the timer. A completed puzzle cleared through the keyboard resumes from its recorded completion time.
- Make above-the-fold board visibility an executable assertion at 1440×1000, 768×1024, 390×844, and 320×800. A universal promise for arbitrarily short landscape viewports would force an unplayably small board or controls, so that unresolved pre-launch design boundary is recorded in the backlog.

## Outcome

- The header contains the brand, subtitle, and copy-link action; there is no separate intro copy or footer.
- The game card has no visible `.status-panel` or occupancy progress UI. Its live status is screen-reader-only.
- A/B clue labels are larger, equal-sized, and tightly spaced while retaining circle/square and orange/blue line identity.
- The full fresh-state board is above the fold throughout the maintained responsive matrix.
- Clear and `R` preserve elapsed time; Replay and New reset to `00:00`.
- The Visual QA harness derives occupancy from rendered cells, asserts the compact page contract and fold position, and distinguishes Clear from Replay timer behavior.

## Trade-offs and consequences

Removing visible status copy makes invalid-move explanations unavailable to sighted players after the brief board nudge. That is an intentional simplification requested for the unpublished game; assistive feedback remains. The responsive guarantee is concrete and tested but intentionally does not claim physically impossible behavior on viewports shorter than the playable interface.

## Verification

- `npm test`: 33/33 tests pass, including static regressions for the compact header, removed chrome, enlarged clue typography, and separate Clear/Replay handlers.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-compact-layout`: 20/20 browser checks pass with no runtime or console errors.
- Thirteen screenshots were opened and inspected at 1440×1000, 768×1024, 390×844, and 320×800. States covered Twain fresh, invalid, drawing, Hint correction, focus, completion, touch, and reduced motion plus Classic fresh and completion.
- The board was fully above the fold in every fresh-state viewport. Enlarged A/B clues stayed legible without clipping, header content remained aligned, and the removed intro, visible status panel, and footer left no spacing defects.
- The browser flow waited until the timer advanced, cleared the board, and verified that elapsed time did not return to `00:00`; Replay then reset it to `00:00`.
- `git diff --check` passes. Temporary screenshots remain outside the repository.

## Follow-ups

Define the intended short-height landscape behavior before public launch; the accepted boundary is tracked in `BACKLOG.md`.
