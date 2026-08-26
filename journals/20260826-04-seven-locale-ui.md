---
date: 2026-08-26
sequence: 04
topic: seven-locale-ui
supersedes: []
---

# Localize Twain without coupling language to the daily puzzle

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain's public preview had English-only UI and sharing copy. The requested locale set was English, Taiwan Traditional Chinese, Japanese, Korean, Spanish, Brazilian Portuguese, plus Simplified Chinese. The same change needed a rightmost globe action, browser-locale automatic selection, and a persistent user override.

The daily contract made one boundary non-negotiable: language may change presentation, but it must never alter the Taiwan date, public number, sampled schedule, stage seeds, generated boards, rule state, or saved progress.

## Decision process

A framework or general-purpose localization package was rejected. Seven static catalogs, a small number of grammar functions, and browser-native `Intl.Locale`/`Intl.DateTimeFormat` cover the concrete need without adding a package, build step, CDN, or runtime service. The catalog uses flat stable keys so tests can enforce parity across every locale.

Browser matching walks `navigator.languages` before `navigator.language`. Chinese is resolved by script and region: Hant or TW/HK/MO maps to `zh-TW`; other Chinese maps to `zh-CN`. Any Portuguese preference maps to the available `pt-BR` catalog. Unsupported preferences fall back to English. An explicit supported code in `twain:locale:v1` wins; selecting **Automatic** removes that key instead of persisting a second auto state.

The header globe was placed after Share and opens an anchored radio-style menu containing Automatic plus locale autonyms. An in-page menu was preferred to another modal because language switching is a lightweight navigation preference; it supports pointer dismissal plus Up/Down/Home/End/Escape/Tab keyboard behavior.

Localization covers metadata, visible controls, dates, progress/completion states, tutorial and Share dialogs, move feedback, cell/board ARIA, Hint grammar, and finished-result text. The brand **Twain** and puzzle clue systems `1…`/`A…` remain invariant. Pure game rules also remain locale-independent: `main.js` maps stable `applyMove().kind` values to localized messages at the UI boundary.

Completion Hint labels and result-share Hint phrases use separate keys. This avoids forcing English noun-phrase grammar into Chinese, Japanese, or Korean sentences.

## Outcome

- Added the seven-locale catalog and pure matching/date/Hint/share helpers in `src/i18n.js`.
- Added full runtime locale application, automatic detection, invalid-override cleanup, explicit persistence/removal, and a rightmost globe menu without changing the daily session.
- Localized header identity, all dialogs and controls, completion/status feedback, accessibility labels, and result-sharing copy.
- Kept the existing locally generated QR implementation; localization required no new QR or package dependency.
- Expanded unit, static, and rendered-browser coverage so future UI changes exercise all seven locale integrations and the language preference lifecycle.

Rendered QA exposed one real responsive defect: at 320px the Brazilian Portuguese date overlapped the Help hit area by 1.83px. The root fix keeps the centered three-column header and 32px actions, but reduces the date from 16px to 14px at widths up to 360px. The harness now asserts that brand, date, Help, Share, and Language rectangles are disjoint.

## Trade-offs and consequences

- Locale choice is browser-local and intentionally does not sync across devices or travel in the shared URL.
- `pt-PT` currently receives Brazilian Portuguese because it is the only supported Portuguese catalog; adding European Portuguese later should refine that match rather than change `pt-BR` copy.
- The six non-English catalogs are complete and mechanically verified, but have not received professional native-speaker review. That stable-release risk is recorded in `BACKLOG.md`.
- `Intl.Locale` and `Intl.DateTimeFormat` are now part of the browser runtime baseline; no compatibility polyfill is carried.

## Verification

- `npm test`: 65/65 tests passed, including seven-catalog parity, browser locale matching, override precedence, localized date validation, Hint grammar, localized share copy, and static integration checks.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-i18n-final2`: 37 browser checks passed with 35 captures and no runtime or console errors.
- The browser run switched all seven explicit locales, verified localized progress-segment titles, reloaded a persisted `zh-TW` override, removed it through Automatic, simulated `zh-Hant-TW` browser preferences, exercised menu keyboard behavior, and verified localized result-share fallback text.
- Inspected the relevant final captures at 1440×1000, 390×844, and 320×800, including English and Portuguese language menus, Traditional Chinese fresh/tutorial/header Share/result Share, and the corrected Portuguese narrow header.
- `node --check` passed for `src/i18n.js`, `src/share.js`, `src/main.js`, and the updated visual harness; `git diff --check` was clean.

## Follow-ups

- Complete the native-speaker review recorded under Localization in `BACKLOG.md` before stable release.
