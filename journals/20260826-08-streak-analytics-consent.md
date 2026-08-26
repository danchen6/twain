---
date: 2026-08-26
sequence: 08
topic: streak-analytics-consent
supersedes: []
---

# Gate optional analytics behind informed consent and record full-run streaks

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain needed browser-local daily streak tracking and a Google Analytics 4 mechanism for completion, elapsed time, Hint use, and related product analysis. No Measurement ID existed yet. The rollout also needed a persistent consent record and a familiar bottom privacy notice so enabling the ID later would not require introducing an unreviewed collection path.

The streak requirement intentionally had no visible UI. The analytics request did require UI because permission had to be understandable, directly actionable, reversible, localized, and fail-closed.

## Decision process

- A streak day represents completion of the entire sampled daily run, not a visit or intermediate stage. This preserves the product meaning of one Twain per Taiwan date and prevents stage-count variation from inflating streaks.
- Streak state remains browser-local to preserve the static architecture. The record keeps current streak, longest streak, total completed dates, and the last completed Taiwan date; transitions are same-day idempotent and reject pre-launch/backward inflation.
- Google Analytics uses basic opt-in behavior. The tag is absent from static HTML and is created only after three gates: the adapter is enabled, its ID is valid, and a versioned local consent record says `granted`. Undecided and declined loads therefore create neither a tag nor a cookieless ping.
- The initial choice uses a fixed bottom bar with direct Decline and Allow actions. A details modal names Google Analytics, standard device/browser/approximate-geography context, the exact Twain outcomes, and explicit exclusions. Help owns the durable Privacy choices entry so the header stays focused. If permission is revoked after a tag was active, consent is updated and the page reloads into the tag-free declined path.
- The consent record includes a schema version, choice, and canonical ISO timestamp. It is deliberately an on-device preference, not a server audit ledger. A material vendor, purpose, or disclosed-data change must bump the consent version and ask again.
- Events are bounded outcomes rather than behavioral exhaust. `daily_run_start`, GA-recommended `level_start`/`level_end`, `hint_used`, and `daily_run_complete` carry numeric aggregates and low-risk context. Paths, moves, seeds, clue values, text, names, email, account IDs, and custom user IDs never enter the event builders.
- Additive stage baselines were added to `twain:daily:v2` instead of bumping the daily-run version. Older v2 play can restore with unknown stage deltas, which are omitted instead of guessed; current progress is not discarded for analytics convenience.

Rejected alternatives were counting a streak on open or stage completion, preloading the Google tag in denied consent mode, sending per-cell/mistake events, inventing a placeholder production ID, adding a consent-management or analytics package, and introducing an account/service solely for cross-device streaks or central consent. They either weakened semantics/privacy, created avoidable noise or dependencies, or exceeded the static product scope.

## Outcome

- `src/streak.js` owns validated browser-local streak transitions under `twain:streak:v1`; final-run completion and restore integrate idempotently through `main.js`.
- `src/analytics.js` owns disabled configuration, consent persistence, lazy Google tag initialization, bounded scalar sanitization, and revocation. The shipped configuration remains `enabled: false` with an empty ID.
- `src/telemetry.js` owns five gameplay event builders. `daily-state.js` persists the three stage baselines without breaking legacy v2 records.
- The localized privacy bar, details modal, Help re-entry, status, failure announcement, and accept/decline actions cover all seven locales. The banner names Google Analytics in its first layer; no streak UI was added.
- `docs/analytics.md` records enablement, data boundaries, custom-definition guidance, recommended analysis, bias/timer caveats, and official Google references. Semantic memory and the backlog now state the local-consent limitation and the remaining production-ID/legal/settings/DebugView checks.

## Trade-offs and consequences

- Clearing browser data, switching devices, or using private browsing resets both streak and consent; this is honest browser-local behavior, not account retention.
- The client clock remains authoritative for the Taiwan date and therefore for streak dates.
- Consent is collected before an ID exists, but the first-layer notice names the intended GA vendor and the details describe the exact future boundary. Enabling that disclosed ID is allowed under v1; changing the purpose/vendor/boundary is not.
- Consented GA represents a self-selected audience. Streak-retention and completion analyses are directional and must not be reported as whole-player metrics.
- Twain's elapsed timer can include hidden-tab time during a running stage, so it is not interchangeable with GA engagement time.
- A remote Google tag becomes an optional runtime request only after later deliberate enablement and consent; core gameplay remains package-free and works without it.

## Verification

- `npm test -- --test-reporter=dot` passed after the final implementation and consent-validation changes.
- `node --check src/main.js`, `node --check .agents/skills/visual-qa/scripts/run.mjs`, and `git diff --check` passed.
- `npm run visual-qa -- --output /private/tmp/twain-visual-qa-analytics-v2` passed the complete five-stage browser harness. It proved initial/declined/granted persistence, Help re-entry, no Google tag/data layer/request while disabled, full-run-only idempotent streak persistence, all prior daily/share/localization interactions, and no runtime or console errors.
- Final pixels were inspected at 1440×1000, 768×1024, 390×844, and 320×800 for the English privacy bar; at 390×844 for the details modal; at 320×800 for Brazilian Portuguese long copy; and in desktop/mobile/Traditional-Chinese Help dialogs for the persistent Privacy choices entry. The first inspection prompted naming Google Analytics directly in the banner; the recapture remained contained, legible, and free of overflow.

## Follow-ups

The backlog carries the production web-stream ID, jurisdiction/privacy and consent-expiry review, GA account retention/settings, custom definitions, key-event setup, DebugView/network verification, native-speaker review, and the decision on whether a local timestamp is sufficient evidence for the intended rollout.
