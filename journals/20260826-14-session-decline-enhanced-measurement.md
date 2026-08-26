---
date: 2026-08-26
sequence: 14
topic: session-decline-enhanced-measurement
supersedes:
  - 20260826-08-streak-analytics-consent.md
  - 20260826-11-enable-ga4.md
---

# Make analytics decline session-scoped and renew consent for Enhanced Measurement

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The production GA4 adapter originally persisted both `granted` and `denied` under `twain:analytics-consent:v1`. Dan wanted a decline to last only for the current browsing session so a future page session asks again, while an allowance should continue to persist.

Dan also reported that Enhanced Measurement had been enabled on the GA web stream. Google's account-side setting can automatically add page views, scrolls, outbound clicks, site searches, video engagement, file downloads, and form interactions. That is a material expansion beyond the earlier disclosure of Twain's custom outcome events plus standard page/device context. The prior decision to keep v1 valid when only the disclosed Measurement ID was configured therefore no longer applied.

## Decision process

- Split the v2 preference by meaning: `granted` is stored in localStorage and `denied` in sessionStorage. A session denial takes precedence over and removes a persistent grant. Reloads in the same page session remain declined; when the browser starts a new page session, the missing denial causes the banner to ask again.
- Keep consent fail-closed. Missing, malformed, or unwritable records never authorize the Google tag. A misplaced current-version persistent denial is moved into sessionStorage when possible so the storage invariant self-repairs without weakening the active denial.
- Bump the storage key and schema to `twain:analytics-consent:v2`. Discard v1 records from both storage areas rather than migrating them, so no earlier grant silently authorizes Enhanced Measurement's expanded data boundary.
- Do not add application instrumentation for Enhanced Measurement. Google controls it on the web stream and begins emitting the enabled automatic events after the already consent-gated tag loads.
- Update all seven localized Privacy details variants. The modal now distinguishes Twain's bounded custom gameplay events from Enhanced Measurement, discloses automatic interaction metadata and cookie-based pseudonymous identifiers, and explains the split session/persistent choice lifetime.
- Explicitly focus the modal Close button after `showModal()`. At 320px the longer copy makes the panel scrollable, and Chromium otherwise focuses that unnamed scroll container before the visible control.
- Extend rendered QA to inspect the details modal at all four maintained viewports, its scroll bottom at 320px, Brazilian Portuguese long copy, Help re-entry, same-session decline reload, simulated new-session re-prompt, immediate grant initialization, persistent grant reload, and active revocation. Google requests remain intercepted locally.

Rejected alternatives were retaining v1, persisting denial with an arbitrary expiry, or adding Enhanced Measurement events in application code. They would respectively reuse permission across a material disclosure change, contradict the requested sessionStorage behavior, or duplicate account-controlled automatic collection.

## Outcome

- Declining now removes a saved grant and writes only a v2 sessionStorage record. It remains tag-free through reloads in that page session and is absent from a fresh session.
- Allowing analytics removes a session denial, writes a v2 localStorage record, and initializes the existing production tag immediately without requiring a reload.
- Existing v1 grants and denials are ignored and removed, so deployed v1 users receive the updated notice before collection under the expanded boundary.
- Privacy copy, semantic documentation, quality contracts, the repeatable visual-QA procedure, and the account-side rollout backlog now describe Enhanced Measurement and the split storage contract.

## Trade-offs and consequences

- A player who declines will be asked again whenever the browser starts a new page session. This repetition is intentional; a persistent “do not ask again” option would require a separate product decision.
- Grants still have no expiry. Jurisdiction-specific notice/legal-basis review and the persistent-grant expiry/re-prompt policy remain account-side rollout work.
- The current Twain surface has no search, video, download, form, or outbound-link feature, so page view and scroll are the applicable Enhanced Measurement categories today. The broader list is disclosed because matching future surfaces would begin automatic collection without another code change.
- Consent remains an on-device preference, not a central audit record. sessionStorage lifecycle details are browser-owned, while localStorage grants still disappear when site data is cleared and do not synchronize across devices.

## Verification

- After synchronizing the isolated branch with `master` at `c1a445f`, `npm test -- --test-reporter=dot` passed all 39 Node tests, including the concurrent click/rewind coverage plus v2 validation, persistent grant, session-only denial, denial precedence, misplaced-denial repair, v1 invalidation, tag gating, revocation, and bounded custom-event coverage.
- `npm run visual-qa -- --output /private/tmp/twain-visual-qa-session-consent-rebased` passed the integrated 40-check, 51-screenshot Microsoft Edge harness. The configured tag request was intercepted locally, so no QA traffic reached GA.
- The 13 affected privacy captures were inspected at 1440×1000, 768×1024, 390×844, and 320×800, including English and Brazilian Portuguese scroll bottoms plus the declined Help re-entry state. The post-sync recaptures were byte-for-byte identical to the inspected final set; copy, cards, status, and actions remained readable with no horizontal clipping.
- The first rendered pass exposed the 320px scroll-container focus defect; explicit Close focus fixed it. Inspection also caught one capture taken during the opening animation; the harness now waits for the stable frame, and the final recapture was clean.
- `node --check src/analytics.js`, `node --check .agents/skills/visual-qa/scripts/run.mjs`, and `git diff --check` passed.

## Follow-ups

- Complete the GA account review retained in `BACKLOG.md`: enabled Enhanced Measurement options and PII risk, data retention, persistent-grant expiry, legal basis/notice, custom definitions, the completion key event, and DebugView verification of automatic and custom events.
- Decide whether an on-device timestamp is sufficient evidence for the intended compliance and audit requirements.
