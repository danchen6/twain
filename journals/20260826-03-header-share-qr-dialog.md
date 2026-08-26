---
date: 2026-08-26
sequence: 03
topic: header-share-qr-dialog
supersedes:
  - "20260826-02-clean-share-payloads.md"
---

# Keep header sharing in-app with a local QR and copyable canonical link

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Header Share had just been narrowed to a URL-only Web Share payload. The desired experience changed again: pressing the header icon should never open the operating-system share sheet. It should open an application-owned overlay containing a QR code and a copyable web address. Finished-result Share remains a separate action with numbered time/Hint copy and native Web Share support.

This entry supersedes only the earlier header-share conclusion. Twain numbering and the Hint-aware result sentence from the previous entries remain current.

## Decision process

- Reject an external QR image/API service. Sending the canonical URL away would add privacy, availability, and network coupling to a static feature that should work offline after load.
- Reject a handwritten encoder. QR version/capacity selection, Reed–Solomon error correction, placement, and masking are standards-sensitive; a home-grown implementation would create disproportionate correctness and maintenance risk for no product benefit.
- Reject package-manager- and bundler-oriented libraries. Twain still needs zero install/build steps, relative static deployment, and no runtime CDN request.
- Vendor the exact ESM distribution of [`qrcode-generator` 2.0.4](https://github.com/kazuhikoarase/qrcode-generator/tree/js2.0.4). It is a self-contained MIT-licensed module with no runtime/transitive package dependency. Preserve the upstream license, provenance, and local SHA-256, and make upgrades deliberate source changes.
- Wrap the third-party matrix API in `src/qr.js`. Twain owns validation, medium error correction, the four-module quiet zone, run-compressed SVG path, pure black/white rendering, and deterministic tests; `main.js` owns only DOM construction and dialog behavior.
- Use a dedicated native `<dialog>` rather than overloading the finished-result fallback modal. The title identifies **Share Twain #N**, the explanation is concise, the QR and read-only URL derive from the same canonical value, and the URL/button stack at 320px.
- Keep the dialog open after Copy so another person can still scan it. A page-level toast sits behind a modal's top-layer backdrop, so header success instead changes **Copy link** to **Copied** for 2.4 seconds and announces the result through the live region. Result fallback copying retains its existing toast.

## Outcome

Header Share no longer calls `navigator.share()` under any capability combination. It opens the numbered QR/link dialog, strips query/fragment state through the existing canonicalization, encodes locally, and copies only after an explicit Copy tap. Secure Clipboard, insecure local selected-text compatibility copy, and visible manual selection all use the same URL. Escape, backdrop click, and Close dismiss the dialog with native focus restoration.

Finished-result Share is unchanged: it still uses Web Share when available and sends `I completed today's Twain #N in mm:ss with <Hint summary>. Can you beat my time?` plus the canonical URL through its existing fallbacks.

## Trade-offs and consequences

The repository gains 51,907 bytes of pinned third-party source plus its 1,071-byte MIT license. This is a vendored static source dependency, not an npm/CDN/runtime-network dependency; it is explicitly documented because QR correctness outweighs the small source footprint.

The QR represents the currently loaded canonical URL. A production visitor gets the GitHub Pages URL; a local developer gets the local server URL, which another device may not be able to reach. This is intentional and avoids environment-specific configuration.

Camera/scanner behavior and Safari rasterization remain physical-device concerns. The existing release backlog now names header QR scanning/link copying and the result native share sheet separately.

## Verification

- `npm test`: 57/57 pass. New QR tests prove deterministic encoding of the production canonical URL, square matrices, all three finder patterns, a four-module quiet zone, content-dependent paths, and invalid-input rejection. Static checks lock the vendored source SHA-256, license/provenance, dialog accessibility wiring, selectable URL policy, and header/result share separation.
- `npm run visual-qa`: Microsoft Edge exits 0 with 33 browser checks, 28 captures, and no runtime or console errors. It proves header Share never invokes a stubbed `navigator.share()`, QR/visible URL agreement, pure black/white SVG plus four-module quiet zone, secure Clipboard, local compatibility copy, selected manual fallback, **Copied** feedback, result native activation/fallbacks, and nested-path loading.
- Inspected the final header dialog at 1440×1000, 768×1024, 390×844, and 320×800, plus mobile **Copied** and manual-selection states at original resolution. The first manual-copy capture exposed an unfinished entrance animation and stale toast in the harness; waiting for the dialog animation and clearing prior feedback produced valid recaptures. A second visual finding showed that a page toast is dimmed behind the dialog backdrop; moving header confirmation into the Copy button fixed the actual UI defect. Final recaptures are contained, balanced, legible, and free of overflow.
- macOS Vision independently decoded the final 320×800 browser screenshot as `http://127.0.0.1:51842/twain/`, exactly matching that harness run's canonical URL.
- `node --check`, `git diff --check`, semantic-memory reconciliation, vendored-file SHA-256 verification, and backlog reconciliation pass. Temporary screenshots and Swift module cache remain outside the repository.

## Follow-ups

The existing physical-device release gate remains: scan the header QR and exercise link copying on iOS Safari, then separately inspect the result native share sheet. No new in-flight item is added.
