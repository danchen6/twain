---
date: 2026-08-26
sequence: 06
topic: social-preview-home-screen
supersedes: []
---

# Give shared and installed Twain a deliberate first impression

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain exposed only a title, description, theme color, and SVG favicon. Shared URLs therefore had no controlled Open Graph image, while iOS Add to Home Screen had neither a dedicated Apple touch icon nor a manifest-defined app experience. The requested improvement also invited using real Visual QA material, generative art, and App Store screenshot design practices.

The deployment remains one locale-neutral canonical GitHub Pages URL. Social crawlers cannot be assumed to execute Twain's browser-locale JavaScript or read a user's persisted language choice.

## Decision process

The social card follows the product-page pattern of one benefit-led headline plus an enlarged real UI hero. A direct full-page screenshot was rejected because most of its pixels would become unreadable at feed size and its daily header would immediately become stale. The selected 1200×630 composition uses a fresh board crop from the deterministic Visual QA run, the evergreen statement **Two paths. Every cell. Never meet.**, and no date, public number, solution, or user result.

The built-in image-generation path produced only a low-contrast warm paper background with two disjoint cyan/orange path accents. Generating the complete card was rejected because exact wordmark, text, clue geometry, and puzzle UI matter more than stylistic novelty. Those semantic layers remain source SVG, text, and a real browser capture. The first composite exposed an orange accent crossing the headline/subcopy; a warm translucent left veil fixed the z-order defect without discarding the generated texture.

The final PNG filename is versioned so a future redesign can point crawlers at a new URL instead of depending on cache invalidation. The static head provides all four required Open Graph properties, structured image type/size/alt fields, canonical/site/locale identity, and matching large-card metadata. English is the truthful crawler language for the one static canonical URL; claiming locale alternates without distinct crawlable representations was rejected.

For install surfaces, the canonical two-stroke `T` becomes an opaque full-bleed near-black icon with no baked corner radius. Its cyan and orange strokes remain inside the maskable safe zone. HTML declares the 180×180 Apple touch icon, which WebKit prefers over manifest icons; the manifest also supplies exact 192×192 and 512×512 `any maskable` PNGs. Standalone display suits a single-page daily game. A Service Worker was deliberately not added because offline cache invalidation and update behavior need their own explicit product contract.

## Outcome

- Added a versioned 1200×630 OG image, its SVG composition source, real fresh-board crop, and generated non-semantic background under `assets/social/`.
- Added an app-icon SVG source plus opaque 180, 192, and 512px PNGs under `assets/icons/`.
- Added canonical Open Graph, large-card, Apple mobile-web-app, manifest, and touch-icon metadata to `index.html`.
- Added `manifest.webmanifest` with project-relative identity/start/scope, standalone display, matching theme colors, and maskable icons; no build step, runtime dependency, Service Worker, or offline claim was introduced.
- Added network-independent PNG/header/manifest tests and expanded the real-browser nested-path harness to load and measure every discovery/install asset.

## Trade-offs and consequences

- The social preview is stable English even when a player uses another UI locale. Localized crawler cards would require distinct locale URLs or server/content negotiation, neither of which belongs in the current canonical static contract.
- Canonical and OG URLs intentionally pin `https://danchen6.github.io/twain/`. A future custom domain must update them, and a changed social image should use a new versioned filename.
- Standalone launch does not mean offline support. Twain still needs network delivery and keeps only progress/preferences in browser-local storage.
- Chromium can validate metadata, nested paths, MIME parsing, dimensions, and ordinary page pixels, but not a social platform's crawler card, SpringBoard's final mask, the Add to Home Screen sheet/name, or an actual standalone iOS launch. The physical-device gate in `BACKLOG.md` now names those gaps.

## Verification

- `node --test tests/metadata.test.js tests/static.test.js tests/i18n.test.js`: 17/17 focused tests passed.
- `npm test`: 67/67 tests passed.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-social-v1`: 38 browser checks passed with 35 captures and no runtime or console errors. The browser fetched and parsed the manifest under `/twain/`, then loaded the 1200×630 OG image and exact 180/192/512px icons.
- Inspected the final 1200×630 card, a 600×315 feed-size reduction, the 180px touch icon, a 60px Home Screen-size reduction, and unchanged 1440×1000/390×844 fresh-game captures. The card retained headline/UI hierarchy, both icon strokes remained legible, and the existing game UI had no pixel regression.
- All four PNG deliverables are opaque RGB images at their declared dimensions. `node --check` passed for the visual harness and metadata test; `git diff --check` was clean before the journal was added.

## Follow-ups

- Complete the physical iOS Add to Home Screen and social-platform crawler checks recorded in `BACKLOG.md` before stable release.
