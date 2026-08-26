# Agent Instructions

## Memory entrypoint

Read [docs/MEMORY.md](docs/MEMORY.md) and [BACKLOG.md](BACKLOG.md) before making changes. The project uses four human-inspired memory layers: current truth in `docs/`, immutable experience in `journals/`, deferred work in `BACKLOG.md`, and repeatable procedures in `.agents/skills/`.

Use the [checkpoint skill](.agents/skills/checkpoint/SKILL.md) before declaring any change complete. Existing journal files are immutable: every repository change and every decision-bearing discussion creates a new journal, and a changed conclusion supersedes an older entry by linking to it from the new file.

## Technical stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Runtime | HTML5, CSS, and browser-native JavaScript ES modules | Keeps the game portable to any static host and makes source code directly inspectable without a compilation layer. |
| Rendering | Inline SVG for the board and path; HTML overlays for clues and hit targets | SVG gives resolution-independent grid/path geometry while HTML preserves accessible labels and reliable input surfaces. |
| Input and state | Pointer Events, keyboard events, localStorage, URL, Clipboard, and other Web Platform APIs | One dependency-free interaction model covers mouse, touch, keyboard, resumable daily play, and canonical sharing. |
| Puzzle logic | Pure JavaScript modules | The generator and game rules run identically in browsers and Node tests without DOM emulation. |
| Tests | Node.js built-in test runner (`node --test`) | Provides fast, network-independent rule and property tests with no development dependency. |
| Local serving | Python standard-library HTTP server | ES modules require HTTP semantics locally; this adds no project dependency or build step. |
| CI and hosting | GitHub Actions and GitHub Pages | The repository can test and deploy the unchanged static source directly. |

Do not add a framework, package dependency, transpiler, bundler, runtime server, or persistence service without recording the concrete need, alternatives, and trade-off in a new journal and updating the affected semantic memory.

## Non-negotiable invariants

- The site remains deployable as static files on GitHub Pages; runtime server code is out of scope.
- `generatePuzzle()` must return a board that passes `validatePuzzle()` and contains complete, disjoint witness lines whose union covers the board.
- Twain completion requires two orthogonal, non-repeating, cell-disjoint lines. Each visits its own clues in ascending order and ends at its final clue; together they occupy every cell without crossing a wall.
- Witness line lengths prove solvability but are not player quotas. Any valid full-board partition must be accepted.
- Every Taiwan calendar date (GMT+8) deterministically samples and shuffles three to five unique daily stages from Easy, Medium, Hard, Extra, and Ultra. The schedule, stage seeds, and generated boards must be identical across browsers running the same deployed code.
- Public daily numbering is launch-relative and independent of generation versions: Taiwan date 2026-08-26 is Twain #1, and every later Taiwan calendar date increments the number by one.
- Seeded generation is deterministic. Changing output for an existing `(version, difficulty, seed)` requires a deliberate format-version decision; changing the daily date-to-seed contract requires a daily-run version decision.
- Locale selection is presentation-only. It must not enter the Taiwan date key, public numbering, schedule, seeds, generated puzzle, rule state, or daily-play storage.
- The checked-in footer release identifier uses `v{yymmdd}r{rev}` (for example, `v260827r1`). Its positive, unpadded Taiwan-date revision resets to `1` each day, advances once per completed app/runtime revision, and remains independent from puzzle, daily-run, storage, analytics-consent, and package versions.
- UI input paths (pointer, tap, and keyboard) must call the same pure rule functions in `src/game.js`.
- Third-party trademarks, logos, proprietary assets, and copied boards must not enter the repository. All gameplay assets and daily boards must be independently created.
- Production code has no runtime package dependency and no build step.

## Commands

```sh
npm run release:bump
npm test
npm run visual-qa
python3 -m http.server 4173
```

Run `npm run release:bump` exactly once after finishing an app/runtime revision; documentation, test, workflow, and journal-only changes do not advance it. Run `npm test` after any generator, model, or interaction change. For UI changes, also perform the manual matrix in `docs/quality.md`.

## Git commits

Create commits only when the user explicitly requests them.

- Follow the semantic/Conventional Commit subject form `type(scope): summary`; use focused types such as `feat`, `fix`, `docs`, `test`, `refactor`, and `chore` according to the change's intent.
- Follow the subject with a brief body that summarizes the material changes. Include motivation or impact when it helps future readers, and do not merely repeat the subject; even a small commit needs a concise change brief.
- Split workspace changes into multiple commits when that creates coherent, independently reviewable or revertible units. Keep every commit internally consistent, run its relevant gates, and never absorb unrelated user work just to make the tree clean.
- Do not add a commit-message linter solely to enforce this convention. Clear history is the goal; local tooling friction is not.
- Every commit created by a coding agent must end with a canonical `Co-authored-by: Name <email>` trailer for each agent that materially authored it. Codex uses `Co-authored-by: Codex <codex@openai.com>` unless a more specific documented identity is available.

## Repeatable workflows

- `.agents/skills/checkpoint/SKILL.md`: required close-out loop for every logical change.
- `.agents/skills/visual-qa/SKILL.md`: capture → judge → fix → recapture loop for every user-visible change.
