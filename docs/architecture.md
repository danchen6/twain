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
styles.css                  visual system and responsive layout
```

`tests/` imports the same pure modules in Node. Browser-only APIs stay in `main.js`, so generation, daily contracts, persistence normalization, and game rules need no DOM shim.

## Data flow

```text
Taiwan timestamp
  -> YYYY-MM-DD date key
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

- `src/daily.js`: daily-run version, Taiwan fixed-offset date conversion and next-boundary duration, deterministic three-to-five-level sampling/shuffling, and date/difficulty seed namespace.
- `src/daily-state.js`: version/date/stage checks, legal replay of persisted paths and history, derived completion state, and storage-safe cloning. Invalid or stale records are rejected rather than partially trusted.
- `src/generator.js`: five difficulty profiles, seeded PRNG, Hamiltonian-path construction and two-line partitioning, clue/wall projection, score-based candidate selection, schema validation, and coordinate helpers.
- `src/solver.js`: deterministic bounded search, pruning, first-solution effort, capped solution-density measurement, and difficulty scoring. It reads clues and walls but never witness paths.
- `src/game.js`: legal moves, cell-by-cell backtracking and body-collision rejection, independent clue progression, full-board solved predicate, global Undo, Clear, and canonical Hint behavior.
- `src/palette.js`: immutable curated gradient pairs and versioned deterministic selection from the stage seed.
- `src/main.js`: mutable daily lifecycle, lazy stage loading, timer pause/resume, completion countdown and live day rollover, localStorage I/O, user-activation-safe Web Share plus clipboard/selected-text/manual fallbacks, tutorial/share dialogs, DOM/SVG rendering, and input normalization.
- `assets/twain-mark.svg`: fixed two-stroke brand geometry shared by the header and favicon; it stays independent from seed-selected gameplay palettes.
- `styles.css`: tokens, layout, component states, accessibility, breakpoints, and motion preferences.

## Persistence and trust boundary

`twain:daily:v2` stores only browser-local play state. The schedule is re-derived from the date instead of trusted from storage. On restore, the date and stage must match that schedule, and every stored path/history snapshot is replayed through `applyMove()` against the deterministically regenerated puzzle. Completion is derived from the restored paths rather than trusted from storage. A reload restores elapsed time but intentionally leaves the timer paused until a valid move or Hint.

The client clock determines the Taiwan date because the site has no runtime service. The canonical URL contains no stage, difficulty, or seed state.

Web Share and Async Clipboard are secure-context platform capabilities, not assumed dependencies. Native sharing is invoked directly from the click that supplied transient activation. If it rejects after consuming that activation, the application asks for a second explicit Copy tap in a modal; local HTTP can instead use a selected-text `execCommand("copy")` compatibility path. This deprecated API is deliberately isolated to the last automatic-copy fallback and can be removed once physical-device support no longer needs insecure local testing.

## Dependency policy

Runtime dependencies require an explicit decision journal. Prefer platform APIs and SVG. Development dependencies are also avoided until a concrete quality gap justifies them.

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
