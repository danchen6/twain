---
date: 2026-08-26
sequence: 10
topic: social-card-question-cta
supersedes:
  - 20260826-09-social-card-copy-background.md
---

# Invite the player with one evenly weighted question

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The social-card cleanup and neutral background in `20260826-09-social-card-copy-background.md` remain accepted, but its imperative **Solve the whole grid.** was revised to address the viewer directly. The requested final headline is **Two paths. Every cell. Can you solve the grid?**, with all three lines set at the same 52px size.

## Decision process

**Can you solve the grid?** won over the prior imperative because the question turns a rules summary into a direct invitation without changing or overstating the objective. A first render kept the first two lines at 67px and placed the question at 56px; the question stayed on one line but ended too close to the board card. Reducing only the question to 52px restored safe space, after which all three lines were deliberately unified at 52px to remove the remaining hierarchy mismatch.

The existing 76px baseline spacing was retained. At the smaller common size it creates intentional breathing room, balances the tall board hero, and remains readable in the 600×315 feed preview. Compressing the line spacing was considered unnecessary after direct inspection.

The raster remains `twain-og-v2.png` because v2 is still uncommitted and undeployed in this working tree; changing its URL again would add version churn without providing crawler-cache value.

## Outcome

- Changed the third headline line and Open Graph/Twitter alt descriptions to **Can you solve the grid?**
- Set all three headline lines to one inherited 52px SVG size.
- Updated the visual design contract and metadata source test to require the selected question and common headline size.
- Preserved the warm neutral motif background, near-complete dual-path board, daily caption, and v2 social URL.

## Trade-offs and consequences

- The headline is less typographically dominant than the earlier 67px treatment, but it gains consistent rhythm, more negative space, and a safer boundary from the board card.
- The static card remains English and evergreen; the question introduces no date, result, or locale-specific state.

## Verification

- `npm test`: 77/77 tests passed.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-og-question-52`: 40 browser checks passed with 42 captures and no runtime or console errors. The v2 metadata/raster loaded under the nested Pages path and the pre-launch 23-of-25-cell source state remained valid.
- Inspected the opaque 1200×630 final raster, its 600×315 feed reduction, and the 1440×1000 source-board capture. All three headline lines have equal visual weight, the question remains on one line with safe right spacing, and the board remains the primary color focal point.
- `node --test tests/metadata.test.js`: 2/2 focused tests passed.
- `git diff --check`: clean before this journal was added.

## Follow-ups

No new follow-up was created. The existing physical social-platform crawler check in `BACKLOG.md` remains unchanged.
