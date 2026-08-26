---
date: 2026-08-26
sequence: 05
topic: traditional-chinese-label
supersedes:
  - 20260826-04-seven-locale-ui.md
---

# Put the concise Traditional Chinese label first

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The initial seven-locale menu named `zh-TW` as `繁體中文（台灣）` and placed English before it. The accepted follow-up is a cleaner `繁體中文` display name and a language order that begins with Traditional Chinese, then English, while retaining the order of the remaining five locales.

## Decision process

**Automatic** remains the first menu row because it is a selection mode rather than a language. The explicit language rows are ordered `zh-TW`, `en`, `zh-CN`, `ja`, `ko`, `es`, and `pt-BR`.

Reordering exposed an implementation coupling: `localeLabel()` used the first supported locale as its unknown-locale fallback. Simply moving `zh-TW` first would therefore have changed that fallback from English to Traditional Chinese. The fallback was instead bound explicitly to `DEFAULT_LOCALE`, preserving English as the behavior for unsupported locales while allowing presentation order to evolve independently.

The canonical locale stays `zh-TW`, and browser matching for Hant or TW/HK/MO Chinese stays unchanged. This supersedes only the display-name and language-order implications of `20260826-04-seven-locale-ui.md`; its localization architecture and persistence decisions remain current.

## Outcome

- The visible locale autonym is `繁體中文`, without a regional suffix.
- The language list begins with `繁體中文`, followed by `English`; Simplified Chinese, Japanese, Korean, Spanish, and Brazilian Portuguese retain their relative order.
- Automatic detection, the persisted override key, the `zh-TW` code, and the English fallback are unchanged.
- Unit and rendered-browser assertions now keep menu order separate from fallback behavior.

## Trade-offs and consequences

The shorter label no longer states its Taiwan region explicitly. The canonical `zh-TW` code and documented Chinese script/region matching retain that technical specificity without adding noise to the menu.

## Verification

- `node --test tests/i18n.test.js tests/static.test.js`: 15/15 tests passed.
- `npm test`: 65/65 tests passed.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-zh-label`: 37 browser checks passed with 35 captures and no runtime or console errors.
- Inspected `1440x1000-language-menu-en.png`: Automatic remains first, followed by `繁體中文`, `English`, and the unchanged remaining locale order; the menu renders without clipping or overlap.
- `node --check` passed for `src/i18n.js` and the visual QA harness; `git diff --check` was clean.
