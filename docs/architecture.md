# Architecture

## Runtime shape

The application is a no-build ES module site:

```text
index.html
  -> assets/twain-mark.svg shared header and favicon brand mark
  -> src/main.js           DOM, daily timer, rendering, input, storage, sharing
       -> src/daily.js      GMT+8 date, sampled schedule, versioned daily seeds
       -> src/daily-state.js persisted-play validation and serialization
            -> src/game.js  pure path transitions and solved predicate
       -> src/generator.js  deterministic candidate generation and selection
            -> src/solver.js bounded difficulty analysis
       -> src/palette.js    deterministic seed-to-route-palette selection
       -> src/qr.js         pure QR matrix/path adapter
            -> vendor/qrcode-generator.mjs pinned QR encoder
       -> src/share.js      pure Hint grammar and finished-result copy
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
          -> pointer / touch / keyboard cell intent
          -> applyMove (pure)
          -> paths + outcome
          -> SVG/DOM render + versioned localStorage snapshot
```

Only the active stage is generated. This keeps initial rendering fast and moves any larger-level cost to a paused stage transition when that level appears.

## Module ownership

- `src/daily.js`: daily-run version, Taiwan fixed-offset date conversion and next-boundary duration, launch-relative public numbering, deterministic three-to-five-level sampling/shuffling, and date/difficulty seed namespace.
- `src/daily-state.js`: version/date/stage checks, legal replay of persisted paths and history, derived completion state, and storage-safe cloning. Invalid or stale records are rejected rather than partially trusted.
- `src/generator.js`: five difficulty profiles, seeded PRNG, Hamiltonian-path construction and two-line partitioning, clue/wall projection, score-based candidate selection, schema validation, and coordinate helpers.
- `src/solver.js`: deterministic bounded search, pruning, first-solution effort, capped solution-density measurement, and difficulty scoring. It reads clues and walls but never witness paths.
- `src/game.js`: legal moves, cell-by-cell backtracking and body-collision rejection, independent clue progression, full-board solved predicate, global Undo, Clear, and canonical Hint behavior.
- `src/palette.js`: immutable curated gradient pairs and versioned deterministic selection from the stage seed.
- `src/qr.js`: validates the canonical URL, invokes the pinned QR encoder at medium error correction, and converts its matrix into a compact SVG path with a four-module quiet zone.
- `src/share.js`: pure Hint-count grammar and numbered finished-result share copy.
- `src/main.js`: mutable daily lifecycle, numbered date identity, lazy stage loading, timer pause/resume, completion countdown and live day rollover, localStorage I/O, the header QR/link dialog, user-activation-safe result Web Share plus clipboard/selected-text/manual fallbacks, DOM/SVG rendering, and input normalization.
- `vendor/qrcode-generator.mjs`: exact vendored ESM distribution of `qrcode-generator` 2.0.4. Its MIT license and provenance remain in `vendor/qrcode-generator.LICENSE` and `THIRD_PARTY_NOTICES.md`.
- `assets/twain-mark.svg`: fixed two-stroke brand geometry shared by the header and favicon; it stays independent from seed-selected gameplay palettes.
- `styles.css`: tokens, layout, component states, accessibility, breakpoints, and motion preferences.

## Persistence and trust boundary

`twain:daily:v2` stores only browser-local play state. The schedule is re-derived from the date instead of trusted from storage. On restore, the date and stage must match that schedule, and every stored path/history snapshot is replayed through `applyMove()` against the deterministically regenerated puzzle. Completion is derived from the restored paths rather than trusted from storage. A reload restores elapsed time but intentionally leaves the timer paused until a valid move or Hint.

The client clock determines the Taiwan date because the site has no runtime service. The canonical URL contains no stage, difficulty, or seed state.

The public Twain number is derived independently from the unversioned launch epoch `2026-08-26 = #1`. It is presentation metadata only: it does not enter daily schedule seeds, puzzle generation, or localStorage, so a generation-version change cannot silently renumber published days.

Header Share never invokes Web Share. It synchronously generates an SVG QR from the canonical URL entirely in the browser, displays the same URL in a read-only selectable field, and copies it only after an explicit Copy tap. No URL leaves the browser for QR generation.

Web Share remains a secure-context platform capability for finished results. It is invoked directly from the click that supplied transient activation and receives title, numbered/time/Hint text, and URL. If native sharing rejects after consuming activation, the application asks for a second explicit Copy tap in a modal. Header and result Copy use Async Clipboard when available; local HTTP can instead use a temporary selected textarea plus `execCommand("copy")`. This deprecated API is deliberately isolated to the last automatic-copy fallback and can be removed once physical-device support no longer needs insecure local testing.

## Dependency policy

Runtime dependencies require an explicit decision journal. Prefer platform APIs and SVG, but QR encoding has standards-sensitive capacity selection, error correction, and masking that browser APIs do not portably provide. Twain therefore vendors the exact MIT-licensed `qrcode-generator` 2.0.4 ESM source: it is served as a relative static module with no npm install, build step, CDN, runtime network request, or transitive dependency. The version and license are visible in `THIRD_PARTY_NOTICES.md`; upgrades are deliberate source changes. Development dependencies are also avoided until a concrete quality gap justifies them.

## Deployment

The public preview deployment target is the `danchen6/twain` GitHub Project Pages site at `https://danchen6.github.io/twain/`; no custom domain is configured. All asset references are relative so the project path works without a configured base path.

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
