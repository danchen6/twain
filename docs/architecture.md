# Architecture

## Runtime shape

The application is a no-build ES module site:

```text
index.html
  -> assets/twain-mark.svg shared header and favicon brand mark
  -> manifest.webmanifest standalone launch contract and install icons
       -> assets/icons/    opaque Apple touch and maskable app icons
  -> assets/social/        versioned OG PNG plus its authoring sources
  -> src/main.js           DOM, daily lifecycle, rendering, input, storage, locale, sharing, consent
       -> src/analytics.js consent-gated Google tag adapter and local consent record
       -> src/telemetry.js pure bounded gameplay event builders
       -> src/streak.js    browser-local daily-completion streak transitions
       -> src/daily.js      GMT+8 date, sampled schedule, versioned daily seeds
       -> src/daily-state.js persisted-play validation and serialization
            -> src/game.js  pure path transitions and solved predicate
       -> src/generator.js  deterministic candidate generation and selection
            -> src/solver.js bounded difficulty analysis
       -> src/palette.js    deterministic seed-to-route-palette selection
       -> src/qr.js         pure QR matrix/path adapter
            -> vendor/qrcode-generator.mjs pinned QR encoder
       -> src/i18n.js       locale catalog, matching, formatting, and UI messages
       -> src/share.js      pure localized Hint grammar and finished-result copy
styles.css                  visual system and responsive layout
```

`tests/` imports the same pure modules in Node. Browser-only APIs stay in `main.js`, so generation, daily contracts, persistence normalization, and game rules need no DOM shim.

## Data flow

```text
Taiwan timestamp
  -> YYYY-MM-DD date key
       -> launch-relative public number -> header/result-share identity
       -> deterministic 3–5 level sample + shuffle
          -> sequential stage index within that schedule
          -> versioned daily stage seed
          -> deterministic candidate pool
          -> bounded solver score + difficulty-quantile selection
          -> validated two-line Puzzle
          -> seed-derived route palette
          -> restored or fresh DailyPlay state
          -> pointer / touch / keyboard gesture intent
          -> applyMove / rewindToPathCell (pure)
          -> paths + outcome
          -> SVG/DOM render + versioned localStorage snapshot

Browser locale preferences + optional stored locale override
  -> supported locale match with English fallback
  -> localized metadata, UI/ARIA copy, dates, feedback, and result sharing

Full daily completion
  -> idempotent browser-local streak transition
  -> current / longest / total completed-day counters

Explicit analytics permission + enabled valid Google tag ID
  -> canonicalized page view + bounded milestone events
  -> Google Analytics 4
```

Only the active stage is generated. This keeps initial rendering fast and moves any larger-level cost to a paused stage transition when that level appears.

## Module ownership

- `src/daily.js`: daily-run version, Taiwan fixed-offset date conversion and next-boundary duration, launch-relative public numbering, deterministic three-to-five-level sampling/shuffling, and date/difficulty seed namespace.
- `src/daily-state.js`: version/date/stage checks, legal replay of persisted paths and history, derived completion state, stage telemetry baselines, and storage-safe cloning. Invalid or stale records are rejected rather than partially trusted; legacy v2 records without baselines restore with unknown stage deltas.
- `src/generator.js`: five difficulty profiles, seeded PRNG, Hamiltonian-path construction and two-line partitioning, clue/wall projection, score-based candidate selection, schema validation, and coordinate helpers.
- `src/solver.js`: deterministic bounded search, pruning, first-solution effort, capped solution-density measurement, and difficulty scoring. It reads clues and walls but never witness paths.
- `src/game.js`: legal moves, cell-by-cell predecessor backtracking, explicit immutable path-cell rewind, body-collision rejection, independent clue progression, full-board solved predicate, global Undo, Clear, and canonical Hint behavior.
- `src/palette.js`: immutable curated gradient pairs and versioned deterministic selection from the stage seed.
- `src/qr.js`: validates the canonical URL, invokes the pinned QR encoder at medium error correction, and converts its matrix into a compact SVG path with a four-module quiet zone.
- `src/i18n.js`: the seven-locale catalog, autonyms, BCP 47 browser matching, English fallback, localized date formatting, Hint grammar, and flat UI message contract.
- `src/share.js`: pure locale-aware Hint-count grammar and numbered finished-result share copy.
- `src/streak.js`: validates and transitions the browser-local current/longest/total streak record against full Taiwan-date daily completions. Same-day and backward-date input cannot inflate counts.
- `src/telemetry.js`: pure builders for bounded daily/stage start, Hint, stage-completion, and daily-completion outcomes. It owns parameter names and units but no transport or browser state.
- `src/analytics.js`: explicit production GA configuration, v2 split local/session consent-record parsing and writing, scalar event sanitization, and lazy Google tag transport using Google's `Arguments`-shaped command queue contract. It targets `G-BBJX7TJD6W` with debug mode off and creates no tag state or request until valid configuration and explicit permission both pass.
- `src/main.js`: mutable daily lifecycle, numbered localized date identity, lazy stage loading, timer pause/resume, completion countdown and live day rollover, daily/locale/streak localStorage plus split local/session consent I/O, localized privacy banner/dialog, event dispatch, the header language and QR/link menus, user-activation-safe result Web Share plus clipboard/selected-text/manual fallbacks, localized DOM/SVG rendering, and input normalization. Pointer normalization distinguishes a cell-crossing drag from a stationary click without a timing threshold, interpolates orthogonal click/drag targets through `applyMove()`, and sends explicit path clicks to `rewindToPathCell()`. Stable rule-result kinds are translated at this UI boundary; the pure rule engine retains locale-independent behavior and messages.
- `vendor/qrcode-generator.mjs`: exact vendored ESM distribution of `qrcode-generator` 2.0.4. Its MIT license and provenance remain in `vendor/qrcode-generator.LICENSE` and `THIRD_PARTY_NOTICES.md`.
- `assets/twain-mark.svg`: fixed two-stroke brand geometry shared by the header and favicon; it stays independent from seed-selected gameplay palettes.
- `assets/icons/`: the full-bleed canonical app-icon SVG plus opaque 180, 192, and 512px PNG derivatives. Important strokes stay inside the maskable safe zone; operating systems own the final corner/mask treatment.
- `assets/social/`: versioned 1200×630 opaque OG PNGs, the real near-complete dual-path crop from a deterministic pre-launch board used inside the current card, its clean warm-paper raster, and an SVG composition source whose sparse neutral puzzle motifs, product UI, wordmark, and copy remain exact.
- `manifest.webmanifest`: project-relative identity, launch scope, theme colors, standalone display, and `any maskable` app-icon declarations. It deliberately does not imply Service Worker or offline support.
- `styles.css`: tokens, layout, component states, accessibility, breakpoints, and motion preferences.

## Persistence and trust boundary

`twain:daily:v2` stores only browser-local play state. The schedule is re-derived from the date instead of trusted from storage. On restore, the date and stage must match that schedule, and every stored path/history snapshot is replayed through `applyMove()` against the deterministically regenerated puzzle. Completion is derived from the restored paths rather than trusted from storage. A reload restores elapsed time but intentionally leaves the timer paused until a valid move or Hint. Additive stage elapsed/Hint/mistake baselines support per-stage outcome metrics without changing v2 or invalidating existing progress; an older record with none of the three baselines is accepted and omits unknown stage deltas.

`twain:locale:v1` is a separate browser-local presentation override containing only one supported locale code. An invalid value is removed. With no value, `navigator.languages`/`navigator.language` select the first supported match; English is the terminal fallback. Selecting **Automatic** removes the key. Locale changes rerender copy and semantic labels around the existing session without touching `twain:daily:v2`.

`twain:streak:v1` contains validated current, longest, and total completed-day counts plus the last completed Taiwan date. Only a derived full-run completion transitions it, and the transition is idempotent. It has no player identifier and no cross-device authority.

`twain:analytics-consent:v2` contains a schema version, `granted`/`denied` choice, and ISO decision time. A grant lives in localStorage and persists across page sessions; a denial lives in sessionStorage, survives reloads in the current page session, and disappears before a later session so the banner asks again. A session denial takes precedence and removes any persistent grant. Missing, malformed, or unwritable consent is fail-closed. Consent v1 is discarded rather than migrated because Enhanced Measurement expanded the disclosed collection boundary. These are local preference records rather than a remote audit log. Functional play, locale, and streak storage are independent of this optional analytics choice.

The client clock determines the Taiwan date because the site has no runtime service. The canonical URL contains no stage, difficulty, or seed state.

The public Twain number is derived independently from the unversioned launch epoch `2026-08-26 = #1`. It is presentation metadata only: it does not enter daily schedule seeds, puzzle generation, or localStorage, so a generation-version change cannot silently renumber published days.

The active locale is also presentation metadata only. It does not enter the Taiwan date key, public-number calculation, schedule, stage seed, generator, puzzle model, or persisted play record, so two players on different locales receive identical boards for the same deployed date/version.

The Twain-owned custom analytics boundary is outcome-only. `main.js` strips query/fragment state before initialization, `telemetry.js` never receives paths, moves, seeds, clue values, text input, or identity, and `analytics.js` admits only bounded scalar parameters. Separately, the consented GA tag uses account-side Enhanced Measurement to collect page views and applicable scroll, outbound-link, site-search, video, file-download, and form events, plus page/link metadata, cookie-based pseudonymous identifiers, and standard device/browser/approximate-geography context. Ad storage, ad user data, ad personalization, Google signals, and ad-personalization signals remain disabled. See [analytics.md](analytics.md) for the exact schema and limitations.

Header Share never invokes Web Share. It synchronously generates an SVG QR from the canonical URL entirely in the browser, displays the same URL in a read-only selectable field, and copies it only after an explicit Copy tap. No URL leaves the browser for QR generation.

Web Share remains a secure-context platform capability for finished results. It is invoked directly from the click that supplied transient activation and receives title, numbered/time/Hint text, and URL. If native sharing rejects after consuming activation, the application asks for a second explicit Copy tap in a modal. Header and result Copy use Async Clipboard when available; local HTTP can instead use a temporary selected textarea plus `execCommand("copy")`. This deprecated API is deliberately isolated to the last automatic-copy fallback and can be removed once physical-device support no longer needs insecure local testing.

## Dependency policy

Runtime dependencies require an explicit decision journal. Prefer platform APIs and SVG, but QR encoding has standards-sensitive capacity selection, error correction, and masking that browser APIs do not portably provide. Twain therefore vendors the exact MIT-licensed `qrcode-generator` 2.0.4 ESM source: it is served as a relative static module with no npm install, build step, CDN, runtime network request, or transitive dependency. The version and license are visible in `THIRD_PARTY_NOTICES.md`; upgrades are deliberate source changes.

Google Analytics is an optional external service rather than a package dependency. Its adapter is native JavaScript and the static app remains fully playable without it, but deliberate production enablement permits the consented page to load Google's remote tag. Keeping the tag out of static HTML makes basic opt-in enforceable and preserves a zero-request declined path. Adding another analytics/vendor endpoint or a consent-management dependency requires a new decision. Development dependencies are also avoided until a concrete quality gap justifies them.

## Deployment

The public preview deployment target is the `danchen6/twain` GitHub Project Pages site at `https://danchen6.github.io/twain/`; no custom domain is configured. Runtime, manifest, and install-icon references are relative so the project path works without a configured base path. The canonical and Open Graph URLs are intentionally absolute production identifiers for crawlers; configuring a custom domain therefore requires updating those static URLs and versioning the social image filename to refresh crawler caches.

`.github/workflows/pages.yml` runs the `Test` job for pull requests into `master`, pushes to `master`, and manual runs. `Deploy Pages` requires that job, has the only Pages and OIDC write permissions, and runs only for the `master` ref outside pull requests. It uploads the unchanged repository as a Pages artifact, preserving the no-build deployment contract. The repository's Pages source must be set to GitHub Actions once before the first deployment.

## Repository knowledge

Project context is divided by lifecycle:

```text
docs/                  current semantic truth
journals/              immutable episodic records
BACKLOG.md              mutable deferred work and open questions
.agents/skills/         repeatable project procedures
```

[MEMORY.md](MEMORY.md) is the canonical router and lifecycle contract.
