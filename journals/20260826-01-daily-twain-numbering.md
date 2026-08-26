---
date: 2026-08-26
sequence: 01
topic: daily-twain-numbering
supersedes:
  - "20260825-17-daily-identity-ballistic-celebration.md"
  - "20260825-19-ios-share-fallback.md"
---

# Give every launched daily run a durable Twain number

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The daily header identified a run only by its abbreviated date, and finished-result sharing said only that the player had completed "today's Twain." The launch date needed a durable public identity: Taiwan date 2026-08-26 is Twain #1, 2026-08-27 is #2, and every later Taiwan calendar day advances once.

This changes the earlier accented date-only header and the earlier unnumbered result sentence. The compact header layout, canonical query-free URL, user-activation-safe sharing pipeline, fallback behavior, and date-driven puzzle generation remain current.

## Decision process

- Derive the number from the already validated Taiwan `YYYY-MM-DD` date key and a UTC-midnight epoch, not from the viewer's local calendar or elapsed hours. This keeps numbering aligned with the same GMT+8 boundary that selects the daily run and avoids daylight-saving behavior.
- Keep the launch epoch unversioned and separate from daily v2 and puzzle v4. A generator or schedule version may change board content deliberately, but it must not silently rename an already published day.
- Treat the number as presentation metadata only. It does not enter schedule seeds, puzzle seeds, schemas, canonical URLs, or localStorage records, so this identity change requires no compatibility-version bump.
- Return no public number before 2026-08-26. Rendering falls back to the existing date-only identity and unnumbered result sentence, which is safer under a wrong pre-launch device clock than displaying `#0`, a negative number, duplicating `#1`, or failing the application.
- Render numbered dates as `#N | Mon D` in the shared near-black ink token. Preserve the existing size, weight, tabular numerals, and centered header position, and replace the generic accessible label with an explicit "Twain number N" label.
- Add the number to finished-result native and fallback share text while leaving header Share's canonical-link behavior unchanged.

## Outcome

`src/daily.js` now owns the launch epoch and the pure `dailyTwainNumber()` mapping. The current launch page renders `#1 | Aug 26`; the fixed 2026-08-29 browser fixture renders `#4 | Aug 29`, and its simulated next-day rollover renders `#5 | Aug 30` without changing puzzle seeds or persisted state.

Finished-result sharing now produces `I've completed today's Twain #N in mm:ss. Can you beat my time?` in both native payloads and copy/manual fallbacks. The visual, product, architecture, model, interaction, quality, workflow, and public README contracts now describe the same numbering rule.

## Trade-offs and consequences

The public number intentionally counts calendar days, not successful publication or play days. Skipping a deployment day would still consume a number. This makes the mapping simple, deterministic, and reversible from a date, but it means the epoch becomes a permanent product contract.

Historical-date selection remains out of scope. A future archive may map a public number back to its Taiwan date, but the current canonical URL continues to mean today's run and exposes neither number nor seed state.

## Verification

- `npm test`: 51/51 tests pass. New coverage proves `2026-08-26 = #1`, consecutive-day advancement, month rollover, leap-day continuity, the pre-launch null boundary, and malformed-date rejection.
- `npm run visual-qa -- --output /private/tmp/twain-numbered-gAUnkk`: Microsoft Edge exits 0 with 32 browser checks, 26 screenshots, and no runtime or console errors. The harness verifies black `#4 | Aug 29`, its accessible label, numbered result payload/copy fallback, and automatic `#5 | Aug 30` rollover.
- Inspected the fresh header at 1440×1000, 768×1024, 390×844, and 320×800, plus desktop and narrow daily-completion states and the 390×844 result-share fallback at original resolution. The longer identity remains centered and unclipped, the black treatment has clear hierarchy, and the complete numbered sentence remains selected, legible, and contained. No rendered defect was found, so no corrective recapture was required.
- The nested-path local server used by rendered QA loaded the unchanged static site and modules successfully. `node --check` and `git diff --check` pass. Temporary screenshots remain outside the repository.
