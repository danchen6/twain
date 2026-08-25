---
date: 2026-08-25
sequence: 19
topic: ios-share-fallback
supersedes:
  - "20260825-15-header-help-share.md"
  - "20260825-17-daily-identity-ballistic-celebration.md"
---

# Make both Share entries resilient on iPhone

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Both the header Share action and finished-run Share action appeared inert on a physical iPhone in Safari and other tested browsers. The shared implementation awaited `navigator.share()` and, on a non-cancellation rejection, immediately awaited Async Clipboard. That sequence had two defects on WebKit: Web Share consumes transient user activation before the clipboard fallback runs, and a nonstandard `undefined` return is treated by `await` as success even though no share sheet appeared. Copy success or failure was announced only in the visually hidden live region, so every failed branch looked like a dead button.

The intended GitHub Pages URL returned 404 during diagnosis, making local HTTP or another undeployed origin a plausible—but unconfirmed—test context. Web Share and Async Clipboard are secure-context APIs; a LAN-served `http://` page therefore needs a separate compatibility path regardless of the native-share failure.

## Decision process

- Keep Web Share as the preferred experience, but invoke it synchronously from the original click with no preceding await. Check the secure context and optional `canShare()` first; preflight does not consume activation.
- Accept only a Promise-like native-share result. Treat a synchronous exception, non-Promise result, or non-`AbortError` rejection as failure. Keep deliberate user cancellation silent.
- Do not attempt another activation-gated API after native Share rejects. Open a visible **Share Twain** dialog instead; its Copy button supplies a fresh user activation.
- When native Share is unavailable from the outset, try Async Clipboard in a secure context. For local HTTP or missing Clipboard API, select an off-screen textarea and use the isolated `execCommand("copy")` compatibility path during the same click.
- If every automatic copy path fails, keep the dialog open, select the actual share text, allow selection and the iOS callout inside that field, and tell the user to copy it manually. This is the only surface that overrides the game's page-wide long-press suppression.
- Confirm successful fallback copy with a transient near-black toast. Do not reintroduce a persistent status panel.

## Outcome

Both Share buttons now use one user-activation-safe pipeline. HTTPS-capable browsers receive the native platform sheet with the existing payload. Unsupported, insecure, rejected, and malformed Web Share implementations degrade to immediate copy, a second-tap copy dialog, or selected manual text without leaving the button visually inert.

Header fallback text contains only the canonical URL. Finished-run fallback text preserves the completion sentence, elapsed time, challenge copy, and canonical URL. Screen-reader feedback remains in the live announcer while sighted users receive the dialog or copied toast.

## Trade-offs and consequences

`document.execCommand("copy")` is deprecated. It remains deliberately isolated to insecure/local contexts where Async Clipboard is unavailable and is always given an explicit textarea selection for older iOS behavior. The selectable manual dialog is the durable final fallback and makes removal of the compatibility call possible later.

The application can verify that `navigator.share()` is entered with active transient activation, but browser automation cannot inspect or operate the OS-owned iOS share sheet. Physical-device confirmation remains necessary. Other iPhone browsers may share WebKit/platform constraints, so testing several browser brands does not replace testing both HTTPS native Share and local-HTTP copying.

## Verification

- `npm test`: 50/50 tests pass. Static regressions require secure-context gating, `canShare()`, synchronous native Share, non-Promise detection, Async Clipboard, selected-text compatibility copy, fallback dialog, visible toast, and selection overrides.
- `npm run visual-qa`: the final Microsoft Edge run exits cleanly with 31 browser checks, 26 screenshots, and no runtime or console errors. It proves both native calls occur while `navigator.userActivation.isActive` is true; covers `canShare()`, Promise success, a WebKit-style `undefined` result, `NotAllowedError`, silent `AbortError`, secure Clipboard, a simulated insecure context that bypasses both native APIs, selected legacy copy, and fully blocked manual copy.
- Inspected the final settled desktop fallback plus 390×844 URL fallback, manual-copy state, copied toast, and finished-result fallback from `/var/folders/z1/glf5lcnj2hq2_mwn6jdtzfz00000gn/T/twain-visual-qa-2026-08-25T16-02-31-729Z`. Both short and long payloads remain contained and legible; the modal and toast do not obscure required controls or overflow the viewport.
- `node --check src/main.js`, `node --check .agents/skills/visual-qa/scripts/run.mjs`, and `git diff --check` pass.

## Follow-ups

- Recheck the native sheet on physical iOS over HTTPS and the copied/manual fallback over LAN HTTP. If either still fails, capture the exact URL, iOS version, and whether a dialog, toast, or system sheet appeared.
