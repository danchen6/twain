---
date: 2026-08-26
sequence: 15
topic: repair-gtag-command-queue
supersedes:
  - 20260826-14-session-decline-enhanced-measurement.md
---

# Make consented Google tag commands executable

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The GA4 console still reported **No data received** after the production stream and consent flow were deployed. Production served the configured `G-BBJX7TJD6W` adapter, Google returned a valid tag for that destination, and a grant loaded the script without a browser error, but no `/g/collect` request followed.

A zero-egress browser comparison exposed the adapter defect: its arrow/rest wrapper pushed each command into `dataLayer` as a JavaScript `Array`, while Google's supported snippet pushes the regular function's `arguments` object. The live Google tag ignored the Array-shaped `consent`, `js`, `config`, and event commands. Replacing only that queue shape caused the same tag to create a `page_view` collect request for the configured stream.

The blast radius was every consented session running the enabled adapter before this repair: the Google script could download, but neither the initial page view nor Twain's later gameplay commands reached the GA transport. Undecided and declined sessions remained correctly silent.

The earlier rendered verification in `20260826-14-session-decline-enhanced-measurement.md` proved consent storage, request gating, tag insertion, and revocation, but not compatibility with the real tag consumer. This entry corrects that transport conclusion; the v2 consent and Enhanced Measurement decisions remain unchanged.

## Decision process

- Preserve the native consent-gated adapter and replace only the command wrapper with a named regular function that pushes `arguments`, matching Google's documented `gtag()` contract.
- Make the Node suite reject Array commands explicitly and compare the values through `Array.from()`. The prior test asserted the incorrect Array representation and therefore encoded the defect instead of detecting it.
- Keep committed tests network-independent. Do not vendor Google's mutable tag, contact GA from CI, or paste the static tag snippet into `index.html`; those alternatives would add unstable third-party code, pollute analytics, or bypass the established no-request-before-consent boundary.
- Retain the browser harness's local interception for routine visual and consent regression coverage. Supplement this repair with a one-off real-tag probe in which every third-party request is intercepted before transmission.

Treating the console state as processing delay was rejected after the unchanged adapter produced no collect request at all. The defect was local and deterministic rather than an account-reporting latency issue.

## Outcome

- `src/analytics.js` now queues every consent, initialization, configuration, revocation, and gameplay event command as an `Arguments` object that the real Google tag processes.
- The analytics unit test locks both the command values and the non-Array queue representation.
- Architecture and quality memory now name the Google command-shape contract. The account-side and DebugView work in `BACKLOG.md` remains open because a locally intercepted request proves transport formation, not receipt or report configuration inside the GA account.

## Trade-offs and consequences

- `dataLayer` commands are intentionally array-like rather than Arrays. Tests and diagnostics may index or spread them, but must not normalize their creation back to rest-parameter Arrays.
- The repair restores collection for future consented sessions; GA cannot reconstruct page views or gameplay events that were never sent before deployment.
- The code, test, and documentation change has no visual or copy effect. The existing consent notice, v2 storage lifetime, privacy limits, and zero-request denied path are unchanged.

## Verification

- `node --test tests/analytics.test.js tests/static.test.js` passed 20 focused tests, including the new non-Array `Arguments` regression assertion.
- `npm test -- --test-reporter=dot` passed all 39 network-independent Node tests. `node --check src/analytics.js` and `git diff --check` passed.
- A zero-egress Microsoft Edge 151 probe ran the changed source with Google's current `gtag.js`. Before consent it observed no Google request; after consent it observed the configured tag plus an intercepted `POST https://www.google-analytics.com/g/collect` carrying `tid=G-BBJX7TJD6W` and `en=page_view`. Every third-party request was fulfilled locally before transmission, and the page reported no runtime error.
- `npm run visual-qa -- --output /private/tmp/twain-visual-qa-gtag-command` passed all 40 browser checks and produced 51 temporary captures. The 13 affected privacy captures were inspected at 1440×1000, 768×1024, 390×844, and 320×800, including the narrow scroll bottom, Brazilian Portuguese long copy, and declined Help re-entry. No clipping, overflow, content, or interaction defect was found, so no recapture was needed.

## Follow-ups

- Complete the existing GA account, data-retention, Enhanced Measurement, custom-definition, key-event, and DebugView verification backlog before treating the rollout as fully validated.
- Account reports cannot recover the consented events missed before this repair; analysis should treat collection as beginning only after the fixed deployment.
