---
date: 2026-08-25
sequence: 09
topic: long-press-suppression
supersedes: []
---

# Suppress long-press selection without intercepting context menus

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The preceding mobile interaction change suppressed accidental double-tap zoom while preserving pinch zoom. Long presses could still invoke text selection or an iOS touch callout, interrupting play even though Twain's interface is an application surface rather than selectable document content.

## Decision process

- Apply `user-select: none` and its WebKit-prefixed form at the document root so the policy covers the header, game card, controls, and How-to panel rather than only the board.
- Add `-webkit-touch-callout: none` for iOS Safari. This is a platform-specific CSS hook, not a viewport restriction, so the existing pinch-zoom and scrolling decisions remain intact.
- Reject a global `contextmenu` event handler. Preventing that event would also disable desktop right-click and other legitimate context-menu behavior even though the request concerns long-press selection.
- Extend both static and rendered-browser checks. The Chromium harness verifies computed selection policy and synthesizes an 800ms touch press; the source test preserves the Safari-prefixed callout rule.

## Outcome

- Long presses no longer select interface text in the maintained mobile browser path.
- The iOS callout is disabled through the WebKit property, while double-tap suppression, pinch zoom away from the board, vertical scrolling, and board drawing keep their existing behavior.
- The Visual QA procedure now treats mobile gesture policy as a repeatable interaction check.

## Trade-offs and consequences

Interface text can no longer be manually highlighted for copying. Twain has no user-authored text field, and the only intended copy operation remains the dedicated Copy puzzle action, so this is an accepted consequence of making the game surface feel native.

Chromium mobile emulation cannot render Safari's native touch callout. The CSS hook is present and statically guarded, but physical iOS Safari remains a pre-launch spot-check in `BACKLOG.md`.

## Verification

- `npm test`: 42/42 tests passed, including static assertions for standard/WebKit selection suppression, touch-callout suppression, double-tap policy, and unrestricted viewport metadata.
- `npm run visual-qa`: 27/27 checks passed in Microsoft Edge with no runtime or console errors. A synthesized 800ms touch press left the selection empty; double-tap scale, touch drawing, scrolling, Classic, Extra, keyboard, and responsive regressions also passed.
- Final 390×844 fresh and touch-drawing captures plus the 1440×1000 fresh capture were opened and inspected. No selection highlight, overflow, or layout regression was present.
- JavaScript syntax and `git diff --check` passed. Screenshots remain temporary and outside the repository.
