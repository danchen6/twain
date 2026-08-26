---
date: 2026-08-26
sequence: 02
topic: clean-share-payloads
supersedes:
  - "20260826-01-daily-twain-numbering.md"
---

# Keep header sharing link-only and make result copy Hint-aware

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The newly numbered result sentence still omitted the player's cumulative Hint count, while header Share sent a title and invitation sentence to native Web Share even though its copy fallbacks already contained only the canonical link. The requested experience was a cleaner link-only header action and a finished result that communicates number, elapsed time, and Hint usage.

This supersedes the earlier result sentence and clarifies the earlier statement that header Share retained canonical-link behavior. Daily numbering, the canonical URL, transient-activation handling, and every native/copy/manual fallback remain current.

## Decision process

- Build Web Share data from `{ url }` and add `title`/`text` only when the caller explicitly supplies them. Passing empty strings lost the desired semantic distinction and could still lead destinations to render empty message fields.
- Make header Share supply no title, text, or clipboard override. Its native payload is exactly `{ url }`, while secure Clipboard, local compatibility copy, and manual fallback all receive the same canonical URL only.
- Keep finished-result Share rich: native Share receives the Twain title, polished result sentence, and URL; copy fallbacks receive the sentence plus URL. This preserves a meaningful result post without reintroducing invitation copy to the header action.
- Use `I completed today's Twain #N in mm:ss with …` rather than the heavier present-perfect phrasing. Format zero as `no hints`, one as `1 hint`, and larger counts as `<k> hints`, then retain the existing `Can you beat my time?` challenge.
- Put Hint grammar and result-copy construction in a small pure module. The visible completion panel and share sentence now share the same singular/plural primitive, and Node tests can cover zero, singular, plural, pre-launch identity, and invalid counters without a DOM shim.

## Outcome

Header Share now gives both `navigator.canShare()` and `navigator.share()` only the canonical URL object. Unsupported or failed native sharing still degrades through the established URL-only copy and manual-selection paths.

For Twain #1, result copy now reads `I completed today's Twain #1 in mm:ss with no hints. Can you beat my time?`, changing naturally to `1 hint` or `<k> hints`. The Hint total remains cumulative across the entire daily run and survives reload through the existing persisted play record.

## Trade-offs and consequences

Twain supplies only a URL for header Share, but the operating system or destination may independently generate a title, thumbnail, or link preview from page metadata. The application cannot suppress destination-owned previews without removing useful page metadata globally.

The new `src/share.js` module adds one ES-module request, but keeps browser orchestration out of pure copy logic and adds deterministic grammar coverage without a dependency or build step.

## Verification

- `npm test`: 54/54 tests pass. New pure tests cover `no hints`, `1 hint`, plural Hints, the unnumbered pre-launch fallback, and invalid Hint counters; static coverage requires the header caller to omit title/text fields.
- `npm run visual-qa -- --output /private/tmp/twain-share-copy-hsxfee`: Microsoft Edge exits 0 with 32 browser checks, 26 screenshots, and no runtime or console errors. Runtime assertions prove the header native payload is exactly `{ url }`, result native/copy payloads include `2 hints`, every existing activation/fallback branch still works, and the nested static path loads the new module.
- Inspected the desktop and 390×844 URL-only dialogs, 390×844 manual-copy dialog, and 390×844 Hint-aware result dialog at original resolution. The header surfaces contain only the selected link; the longer result sentence and URL remain legible, selected, and contained with no overflow. No rendered defect was found, so no corrective recapture was required.
- `node --check`, `git diff --check`, semantic-memory reconciliation, and the unchanged backlog pass the final checkpoint. Temporary screenshots remain outside the repository.
