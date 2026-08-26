---
date: 2026-08-27
sequence: 1
topic: source-controlled-release-footer
supersedes:
  - "20260825-04-compact-game-layout.md"
---

# Identify each shipped app revision in the footer

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The deployed static app had no visible source-revision identifier. That made screenshots, bug reports, and cache/deployment checks harder to tie back to a concrete repository state. Dan requested a quiet footer version whose date follows Taiwan time and whose revision restarts each day. After reviewing alternatives, he selected a checked-in identifier and finalized the compact, unpadded form `v{yymmdd}r{rev}`; the first revision for 2026-08-27 is therefore `v260827r1`, not `v260827r01`.

This narrowly supersedes the no-footer conclusion in `20260825-04-compact-game-layout.md`. Its play-first hierarchy, removed status chrome, and maintained above-fold board contract remain current. The GitHub Pages decision in `20260825-18-public-preview-pages.md` also remains current: Actions still deploys the repository's unchanged static source.

## Decision process

- Store one literal release identifier in `index.html`, expose it in a subtle in-flow footer, and update it explicitly with `npm run release:bump`. This keeps the displayed value reviewable and makes a deployed file sufficient to identify its source revision.
- Reject deriving the footer from journal counts because journals record decisions rather than shipped app revisions. Reject Git tags as the only source because the static page cannot read repository metadata. Reject an Actions run number or build-time injection because retries would change the identifier and would violate the no-build, unchanged-artifact deployment contract.
- Use the fixed GMT+8 date contract already owned by `src/daily.js`. `rev` is a positive, unpadded integer: it starts at `1` on a later Taiwan date and increments without a width limit on the same date (`r99` becomes `r100`). Retrying or redeploying the same source keeps its identifier. A revision consumed by repository history is not reused, so a failed deployment may leave a gap in the publicly observed sequence.
- Treat the footer revision as app-release metadata only. It does not replace package SemVer, public Twain numbering, puzzle format, daily-run, storage, locale, or analytics-consent versions.
- Guard the source transition in pull-request and push CI. Changes to the shipped app surface must advance exactly once from the trusted base; documentation, tests, workflows, scripts, skills, and journals alone retain the prior value. A deliberate version-only corrective revision is allowed.

## Outcome

- `index.html` now carries `v260827r1` below the game card. The 11px tabular-numeric footer uses the existing subtle color and does not compete with the board.
- `scripts/release-version.mjs` owns parsing, validation, Taiwan-date rollover, marker replacement, and transition rules. `scripts/bump-release.mjs` provides the explicit source edit, while `scripts/check-release-version.mjs` compares the checked-out app surface with a trusted Git base.
- The Pages test job fetches full history and checks pull requests against their base SHA and pushes against the pre-push SHA. Manual redeployment skips the transition check and retains the checked-in identifier. Repository content permissions remain read-only and the deployed artifact remains unchanged source.
- The checkpoint procedure, contributor guidance, semantic memory, Node tests, and rendered-browser harness now share the same release contract.

## Trade-offs and consequences

The source revision requires one explicit maintainer action for each logical app change. CI detects omitted, stale, and duplicate transitions, but concurrent branches can still select the same next value; the later branch must rebase and advance from the new base before merge. The two-digit year intentionally supports 2000 through 2099 and is presentation metadata rather than a globally unique release ID.

The first rendered pass found the fixed, translucent privacy bar partially covering the footer at 1440px and 768px widths. Wider layouts now hide only the footer while the initial privacy bar is open and reveal it after a choice; 390px and 320px layouts keep enough in-flow clearance to show both without overlap. This preserves the footer's diagnostic value on narrow screens without allowing metadata to compete with a required privacy decision.

## Verification

- `node --test tests/release-version.test.js tests/static.test.js` passed all 14 focused tests, including malformed dates, rejection of a padded revision, same-day `r99` to `r100`, GMT+8 rollover, exact source transitions, the static footer, the bump command, and both CI bases.
- `npm test` passed all 88 network-independent Node tests after the final version format and layout correction.
- `npm run visual-qa -- --output /private/tmp/twain-release-footer-final.TpfvlD` passed the complete Microsoft Edge matrix without runtime or console errors. Final fresh and privacy captures were inspected at 1440x1000, 768x1024, 390x844, and 320x800: the board remained above the fold, the footer stayed subtle and below play, wider privacy states showed no overlap, and narrow states retained visible clearance. The overlap found in the first pass was fixed and recaptured before acceptance.
- `node scripts/check-release-version.mjs HEAD` accepted `v260827r1` as the initial app-bearing transition from the current base.
- `git diff --check` passed.

## Follow-ups

None. The recurring bump and verification steps are encoded in the checkpoint skill and CI rather than deferred to the backlog.
