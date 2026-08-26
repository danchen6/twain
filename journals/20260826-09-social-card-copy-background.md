---
date: 2026-08-26
sequence: 09
topic: social-card-copy-background
supersedes:
  - 20260826-07-near-complete-social-board.md
---

# Make the social card invitation clearer and keep the board visually dominant

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The near-complete dual-path board from `20260826-07-near-complete-social-board.md` explained Twain's mechanic well, but the surrounding card still carried a category capsule, a long Taiwan-day sentence, the printed deployment URL, and the rule-like ending **Never meet.** The requested refinement was a cleaner App Store-style hierarchy, a stronger call to action, an explicit three-to-five-challenge benefit, and a background that did not visually merge with the colored routes inside the real board.

This entry supersedes the earlier journal's acceptance of the headline, caption, and generated path background. Its spoiler-safe pre-launch board decision remains in force.

## Decision process

The category capsule and printed URL were removed because neither adds meaning that survives a small feed preview: the board already establishes the category, while the shared card itself is clickable. **3–5 fresh challenges every day.** replaces the Taiwan-specific cadence sentence with a concise player benefit and uses an en dash for the numeric range.

`Satisfy` was rejected as a standalone English CTA because it is abstract and unidiomatic for this mechanic. **Make it fit.**, **Can you make them fit?**, **Make both paths fit.**, **Bring both paths home.**, and **Leave no cell behind.** were considered. The selected **Solve the whole grid.** is direct, accurate, four words long, and does not imply that the two paths should fit together or meet. It renders slightly smaller than the first two headline lines so the complete phrase stays on one line at both full and feed-preview sizes.

The first copy-only revision retained the generated cyan/orange path background. Review exposed a semantic rather than merely contrast problem: the large cyan route beside the card could be read as part of the real game board. Reducing its opacity would not remove that ambiguity. The current source therefore derives a clean warm-paper raster from a path-free region of the existing texture and adds only sparse neutral circle, square, dot, and orthogonal-line SVG motifs. Re-generating the full card or background was unnecessary; exact vector placement provided better control while preserving the accepted paper character.

The final raster moved to `twain-og-v2.png`. Keeping the old URL was rejected because social crawlers commonly retain image caches; a versioned URL makes the new preview addressable without relying on cache purges.

## Outcome

- Removed the **Daily logic puzzle** capsule and printed `danchen6.github.io/twain` URL from the composition.
- Replaced the headline with **Two paths. Every cell. Solve the whole grid.** and the caption with **3–5 fresh challenges every day.**
- Replaced large decorative colored paths with a clean warm-paper raster and sparse neutral puzzle-derived motifs while preserving the authentic 23-of-25-cell board hero.
- Published the opaque 1200×630 card as `assets/social/twain-og-v2.png` and updated Open Graph, Twitter Card, and accessible image descriptions to the cache-busting URL and current copy.
- Updated the metadata tests, browser harness, architecture, and visual design contract to describe and enforce the new current state.

## Trade-offs and consequences

- The static social card remains English because Twain still has one locale-neutral canonical URL.
- The four-word CTA needs a smaller third-line size than **Two paths.** and **Every cell.**; it remains visually stronger than the caption and readable at 600×315.
- The old v1 raster remains available for already-cached references, while current metadata points exclusively to v2.
- The motifs are deliberately neutral and low contrast. They add texture but leave cyan/orange route color exclusive to the Twain mark and real board hero.

## Verification

- `npm test`: 77/77 tests passed, including current v2 social URLs, alt copy, source-copy removals, and opaque 1200×630 paper/final raster dimensions.
- `npm run visual-qa -- --output /tmp/twain-visual-qa-og-v2-final`: 40 browser checks passed with 42 captures and no runtime or console errors. The nested Pages path loaded the v2 raster and matching metadata, sampled it as nonblank, and reproduced the spoiler-safe pre-launch 14/9-cell route prefixes.
- Inspected the final opaque RGB 1200×630 card, a 600×315 feed-size reduction, and the final 1440×1000 pre-launch source state. The headline and daily caption remain legible, the neutral motifs do not read as gameplay, both real colored routes remain clear, and no capsule, printed URL, or decorative colored background path remains.
- `git diff --check`: clean before this journal was added.

## Follow-ups

The existing physical social-platform crawler check in `BACKLOG.md` remains the only release follow-up; this change creates no additional deferred work.
