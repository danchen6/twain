# Backlog

This file contains unresolved questions, carried risks, and work deliberately deferred beyond the current change. It is mutable: remove items when resolved or when their accepted outcome has been promoted into semantic and episodic memory. Do not mirror in-flight task status here.

## Product identity

- [ ] Before graduating the public preview to a stable release, assess whether **Twain** creates unacceptable search, repository-name, domain, literary-association, or trademark collisions.

## Puzzle quality

- [ ] Before graduating the public preview to a stable release, validate all five solver-calibrated bands and Ultra's roughly two-minute target against a broader human cohort's solve time, mistakes, and Hint usage. Also measure whether shuffled schedules—especially an Ultra opening—and variable three-to-five-stage run lengths create unacceptable early abandonment or daily-time variance. Search effort and one player's calibration are not substitutes for playtesting.

## Daily contract

- [ ] Before graduating the public preview to a stable release, decide whether trusting the device clock for the Taiwan date is acceptable. The static architecture intentionally has no authoritative server clock, so a wrong or deliberately changed client clock can select another daily run.

## Performance

- [ ] Before graduating the public preview to a stable release, benchmark synchronous 10×10 Ultra generation on representative low-end phones both at initial load (Ultra may now be first) and during a paused transition. Desktop sampling is sub-second at the median, but slower devices may need a worker or lighter bounded-search budget if latency becomes noticeable.

## Analytics and privacy

- [ ] Complete the account-side rollout for GA4 stream `G-BBJX7TJD6W`: review the notice/legal basis, persistent-grant expiry/re-prompt policy, enabled Enhanced Measurement options and PII risk, and Google account/data-retention settings for the intended jurisdictions; configure the recommended custom definitions plus `daily_run_complete` key event; and verify automatic and custom events in DebugView before treating analytics as fully validated.
- [ ] Decide whether the browser-local consent timestamp is sufficient for the rollout's compliance/audit requirements. It is intentionally compatible with the static architecture but disappears when site data is cleared and cannot provide a central ledger or cross-device withdrawal; those requirements would need a separately approved service or consent platform.

## Quality automation

- [ ] Add committed visual-regression baselines and CI browser provisioning. The local deterministic harness captures and checks real browser states, but it does not compare pixels automatically.
- [ ] Before graduating the public preview to a stable release, spot-check multi-glyph clue fit, double-tap, long-press callout suppression, pinch zoom, scrolling, board drawing, localStorage restore, header QR scanning/link copying, the result native Share sheet, local-HTTP copy fallback, Add to Home Screen icon/name and standalone launch, and the complete daily transition flow on physical iOS Safari. Chromium mobile emulation can prove result-share activation, application fallbacks, and install-asset loading, but cannot reproduce Safari's exact rasterization, camera scanning, native touch behavior, SpringBoard mask, Add to Home Screen sheet, or OS-owned share sheet.

## Responsive design

- [ ] Before graduating the public preview to a stable release, define and verify a short-height landscape layout. The current above-the-fold guarantee covers 1440×1000, 768×1024, 390×844, and 320×800; arbitrarily short viewports would require shrinking controls or the board below the current playability target.

## Accessibility

- [ ] Before graduating the public preview to a stable release, add a non-outline keyboard-focus cue for the board that preserves the square, border-free visual treatment.
- [ ] Before graduating the public preview to a stable release, validate inactive-line clue contrast and active-line discoverability with keyboard and low-vision users. The current 45% opacity is an intentionally strong prototype cue but reduces clue contrast until that line is selected.

## Localization

- [ ] Before graduating the public preview to a stable release, have native speakers review the six non-English locale catalogs end to end, including game terminology, move/error feedback, tutorial/privacy/completion tone, accessibility labels, Hint grammar, and result-sharing copy. The current translations are complete and mechanically verified but have not had professional linguistic review.
