# Product Contract

## Identity

The canonical product name is **Twain**, with the subtitle **Never the twain shall meet**. The subtitle remains the metadata and written tagline for the non-crossing two-line mechanic; the compact play header identifies the active run by its public number and date. The brand mark is a capital `T` formed by two differently colored strokes whose deliberate junction gap repeats the rule that the lines never meet.

## Goal

Provide one original three-to-five-stage puzzle run per Taiwan calendar date. A single player guides two lines that divide every selected board without meeting.

## Release status

Twain is an MIT-licensed public preview. The preview asserts the documented puzzle invariants and release gates, but it does not claim broad human difficulty calibration, full physical-device coverage, professional linguistic review of every locale, or stable-release readiness. Focused external contributions may be accepted; the roadmap and maintenance do not depend on them.

## Rules

1. Draw the round Number line through `1, 2, 3…` and the square Letter line through `A, B, C…`.
2. Move only between orthogonally adjacent cells.
3. A line may use only its own clues and must visit them in displayed order.
4. Never repeat a cell, share a cell between lines, or cross a wall.
5. Each line ends on its final clue; either line may finish first.
6. Together the two lines must occupy every grid cell.

There is no required per-line length or cell quota. Generated witnesses prove solvability but do not prescribe the player's partition; any valid full-board partition wins.

Clicking or tapping an earlier cell on a drawn route rewinds that route directly to the chosen cell so it can be redrawn. Dragging the tail through its immediate predecessors backtracks one cell at a time, while colliding with any older non-predecessor body cell is a quiet no-op. Keyboard movement to the immediate predecessor follows the same one-cell rule, and Undo remains the global chronological correction action.

## Daily run

- Taiwan time (fixed GMT+8) defines the date boundary; a new day starts at 16:00 UTC.
- The launch date, 2026-08-26, is Twain #1. Every later Taiwan calendar date increments this public number by one; it does not reset when puzzle or daily-run versions change. A pre-launch device date has no public number and falls back to a date-only label instead of showing zero or a negative number.
- Every date deterministically samples three to five unique levels from Easy, Medium, Hard, Extra, and Ultra, then shuffles their order. The same date and deployed version produce the same schedule and boards in every browser.
- Stages unlock sequentially. Progress is informative, not a stage selector.
- One elapsed timer spans the selected stages. It pauses after a stage, resumes on the first valid move or Hint in the next stage, and stops after the final selected level.
- Clear removes only the current board's paths and Undo history. It never resets elapsed daily time or completed stages.
- The current stage, paths, active line, Undo history, hint/mistake counts, and elapsed time persist in localStorage. Reload restores them paused until the next valid move or Hint. Persistence is browser-local, not cross-device.
- Completing every selected stage records one browser-local daily streak day. Same-day restores are idempotent, consecutive Taiwan dates extend the streak, and a missed date resets the current streak without erasing the longest streak or total completed days. Streak has no visible UI yet.
- Reloading, returning to a visible tab, or reaching zero on the finished-run countdown after the Taiwan date changes starts the new daily run.
- Header Share always opens an in-app dialog with a locally generated QR code and the copyable canonical page URL; it does not invoke the platform share sheet. Copy uses the Clipboard API when available, a local compatibility copy otherwise, and leaves the visible URL selected for manual copying if both are blocked. The date-to-seed rule, rather than query parameters, makes the linked board set reproducible.
- Final completion remains visible after reload with the finished time, cumulative Hint count, a live countdown to the next Taiwan day, and a Share action whose localized result copy includes the public Twain number, finished time, grammatically formatted Hint count, challenge sentence, and canonical URL.

## Language and locale

- The complete interface is available in Traditional Chinese (`繁體中文`, `zh-TW`), English (`en`), Simplified Chinese (`zh-CN`), Japanese (`ja`), Korean (`ko`), Spanish (`es`), and Brazilian Portuguese (`pt-BR`). This includes visible copy, dates, metadata, dialogs, move feedback, progress/completion states, sharing text, and accessibility labels.
- With no override, Twain selects the first supported match from the browser's locale preferences and falls back to English. Chinese script and region subtags distinguish Traditional from Simplified Chinese; Portuguese variants use the available Brazilian Portuguese localization.
- The rightmost header globe opens a language menu. Choosing a language persists a browser-local override; choosing **Automatic** removes it and returns to browser detection.
- **Twain**, numeric/alphabetic clue glyphs, puzzle rules, Taiwan date boundaries, public numbering, daily schedules, and stage seeds are locale-independent. Changing language updates presentation only and never changes or resets play state.

## Privacy and measurement

- Optional Google Analytics is configured for the production web stream `G-BBJX7TJD6W`. The Google tag is never loaded unless that valid configuration remains enabled and the current browser has explicitly allowed analytics.
- With no saved choice, a localized bottom banner presents direct **Decline**, **Allow analytics**, and **Privacy details** actions. Help → **Privacy choices** lets the player review and change the choice later. Declining stores only a session-scoped denial, so reloads in that page session stay tag-free while a later page session asks again. Allowing analytics persists in the browser. Revoking after activation reloads into the session-denied, tag-free state.
- Consent v2 records only the decision, schema version, and decision time. Grants use localStorage; denials use sessionStorage. Neither is an account-level or centrally auditable record, and clearing the relevant browser state removes it. Earlier v1 consent is discarded because enabling Enhanced Measurement materially expanded the disclosed data boundary.
- Twain's custom analytics remains outcome-level: daily/stage starts and completions, elapsed time, Hint/mistake totals, streak totals, interface locale, display mode, and bounded board context. Google Analytics Enhanced Measurement separately adds automatic page views and applicable scroll, outbound-link, site-search, video, file-download, and form interactions, together with page/link context, cookie-based pseudonymous identifiers, and standard device/browser/approximate-location context.
- Twain's custom events exclude paths, individual moves, seeds, names, email addresses, account IDs, and free-text input. Functional localStorage for play, language, and streak remains available when optional analytics is declined. The complete contract and rollout checklist live in [analytics.md](analytics.md).

## Discovery and Home Screen

- The static document publishes a canonical production URL plus complete Open Graph image metadata and a matching `summary_large_image` card. Social crawlers receive stable English identity copy because the one canonical URL does not encode a locale.
- The versioned 1200×630 social image uses a real near-complete Twain state: both witness paths stop one cell before their final clues. Its deterministic capture date predates the numbered public run, so it shows the core two-line interaction without spoiling a playable daily board, displaying a completion result, or becoming stale on the next Taiwan day.
- iOS receives a dedicated opaque 180×180 `apple-touch-icon`. The Web App Manifest adds opaque 192×192 and 512×512 full-bleed icons, a short **Twain** launch name, project-relative start/scope URLs, and standalone display.
- Home Screen installation changes presentation only. Twain still has no Service Worker or offline/update contract; a standalone launch remains the same network-served static game and browser-local progress model.

## Current scope

- Pointer/touch head drawing, orthogonal click/tap-to-draw, direct click/tap path rewind, clue/path-driven line selection, keyboard arrows plus `N`/`L`, cell-by-cell tail backtracking, quiet non-predecessor drag-body collisions, global Undo, Clear, and Hint.
- Curated high-contrast route gradients selected deterministically from each stage seed.
- Header Help opens the compact rule tutorial as a native modal. Header Share opens a separate QR/link modal; final-result Share retains the platform menu plus copy/manual fallbacks.
- The rightmost header Language action exposes Automatic plus all seven locale autonyms without leaving the play surface.
- A localized privacy banner and modal consent manager gate the production-configured analytics adapter; Help provides the persistent re-entry point.
- Shared links expose a rich social card, and supported browsers can add Twain to the Home Screen with dedicated branding and standalone launch chrome.
- Mobile play suppresses accidental double-tap zoom and long-press selection while preserving pinch zoom away from the board.
- Responsive static Web UI hosted without a build, package install, CDN, external QR service, or application runtime service. The explicitly enabled GA tag is the only optional third-party runtime request, and it remains unreachable without browser-local consent.

The game remains single-player. Accounts, cross-device sync, historical-date selection, custom seeds, a puzzle archive, visible streak/history UI, leaderboards, and social collaboration are not current scope.

## Visual contract

The binding visual language is in [design.md](design.md). Do not reproduce third-party logos, wordmarks, proprietary icons, page chrome, boards, or exact assets.

## Product quality boundary

All generated boards are guaranteed solvable. Uniqueness is not required. Difficulty bands are calibrated by deterministic bounded search over candidate boards, using search effort and capped solution density rather than clue or wall count alone. This is a reproducible engineering proxy, not proof of human-perceived difficulty; the five available bands still need broader playtest validation before the public preview can graduate to a stable release.
