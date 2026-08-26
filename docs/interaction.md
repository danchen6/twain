# Interaction Semantics

## Daily session state

`main.js` combines a pure persisted play record with transient rendering/timer state:

```js
{
  dateKey,
  schedule,
  stageIndex,
  elapsedMs,
  runningSince,
  puzzle,
  palette,
  paths: { a: [], b: [] },
  activeLineId,
  history,
  hints,
  mistakes,
  stageElapsedBaselineMs,
  stageHintsBaseline,
  stageMistakesBaseline,
  stageCompleted,
  dailyComplete
}
```

`palette` is derived from `puzzle.seed` and affects presentation only. Rule transitions return new path maps; they do not mutate the puzzle or existing paths. History snapshots include both paths and the active line, so Undo is global and chronological across line switches.

The versioned localStorage record omits the deterministic schedule, regenerated puzzle, palette, transient `runningSince`, and derived completion flags. Restore re-derives the schedule, accepts only its current Taiwan date/stage, and replays every path and history snapshot through `applyMove()`. Stale, malformed, or illegal records reset to today's first selected stage. The three stage baselines are additive v2 fields used only to derive stage-level elapsed time, Hint count, and mistake count. Legacy records with all three absent restore safely with unknown per-stage deltas.

## Rule transitions

Every extension and one-cell keyboard backtrack resolves to an active line plus one target cell and calls `applyMove(puzzle, paths, activeLineId, target)`. An explicit click/tap on the body of a selected route instead calls the pure `rewindToPathCell()` transition.

- Empty line: only that line's first clue (`1` or `A`) can start.
- Existing active-line cell passed to `applyMove()`: the current tail is a quiet no-op. Moving to its immediate predecessor removes exactly the tail; repeating backtracks one cell at a time. Any older body cell is rejected without changing either line.
- Existing active-line cell passed to `rewindToPathCell()`: the tail is a quiet no-op; any earlier cell removes the entire suffix after that cell in one immutable transition. Undo therefore restores the whole suffix removed by that one explicit click.
- New cell: it must be adjacent to the active tail, absent from both lines, not wall-separated, not owned as a clue by the other line, and not an out-of-order clue.
- Final clue: a line may finish before the board and cannot extend again unless undone. Completion waits for both valid lines to fill the board.
- Completion is evaluated after every accepted extension.

### Correction-gesture invariant

Do not collapse the immediate predecessor and older body into one generic “existing path” case. Every interaction change must preserve this matrix and its browser regressions:

| Gesture | Existing-route target | Required result |
| --- | --- | --- |
| Click/tap | Current tail | Quiet no-op; line selection still applies. |
| Click/tap | Any earlier cell | Select that route's owner and rewind directly to the target in one transition. |
| Drag from the tail | Immediate predecessor | Backtrack exactly one cell; repeated predecessor crossings continue cell by cell. |
| Drag from the tail | Any older non-predecessor body cell | Quiet no-op; never infer or delete the skipped suffix. |
| Keyboard arrow | Immediate predecessor | Backtrack exactly one cell through `applyMove()`. |
| Keyboard arrow | Any older non-predecessor body cell | Reject without changing either path. |

There is no visible line selector. Starting a pointer gesture on either line's clue or existing path selects that line automatically. Pointer down only records the start cell and defers path mutation. Leaving the start cell for another cell (or leaving the board) permanently classifies that gesture as a drag: an unoccupied start is applied first when drawing continues across the board, subsequent cells draw from the current tail, and tracing the route's immediate predecessors backtracks one cell per crossed predecessor. Touching any older non-predecessor body cell is a quiet no-op, preventing an imprecise forward drag from deleting a long suffix. A fast jump to an older body cell does not infer the skipped backtracks.

Pointer up without ever crossing a cell boundary is a click/tap. Clicking an existing route rewinds it directly to that cell. Clicking an unoccupied cell in the active tail's row or column applies every intermediate cell through `applyMove()` and stops at the first rejected rule transition; an adjacent click remains a one-cell move, while a non-adjacent diagonal click is a quiet no-op. This uses cell transitions rather than elapsed-time or pixel-distance thresholds, so a held-but-stationary pointer is still a click and any cross-cell movement remains a drag even if it returns to the start. Pointer cancellation never commits a click.

Keyboard `N` selects Number and `L` selects Letter; arrows move relative to the active tail; Enter/Space starts; Backspace undoes; `H` hints; `R` clears.

The active line is full opacity and the inactive line is faded; both return to full opacity on completion. The UI shows daily-stage progress but no occupancy or per-line quota.

Rejected moves never animate or displace the board. Non-quiet rejection feedback is announced through the off-layout live region; the paths, timer, and board geometry remain unchanged.

Page-level touch policy suppresses double-tap zoom, long-press selection, and the iOS callout. Pinch zoom remains available away from the board, and the page remains vertically scrollable outside an active board gesture.

## Hint contract

Hints use the witnesses:

1. Find each player line's common prefix with its witness.
2. Remove every suffix after a first divergence so the canonical prefixes remain mutually compatible.
3. Append one witness cell to the active line, or the first incomplete line if the active witness is complete.

This guarantees progress. Because valid alternate paths and partitions are accepted, a hint may replace an alternate prefix even if it could eventually solve the puzzle.

## Daily progression and timer

- Each Taiwan date deterministically samples three to five unique levels and shuffles them. The resulting schedule cannot be skipped even though difficulty may rise or fall between adjacent stages.
- The timer begins on the first accepted move or Hint of the first selected level.
- Finishing a stage snapshots elapsed time, pauses the timer, marks its progress segment complete, and reveals the animated transition overlay in place over the board.
- Continue generates the next board while paused. The first accepted move or Hint resumes from accumulated time.
- Clear empties only the current paths/history. A running timer keeps running; a restored or newly advanced paused timer remains paused until play resumes.
- Completion of the final selected level stops the timer. Intermediate overlays use **Nicely done!**, cumulative Hint count, and **Next level**. The final overlay uses **Well played!**, completed time plus Hint count, a live countdown to the next Taiwan midnight, and result Share; neither state prints a level/daily-complete kicker. Both overlays generate seeded, varied particles from all eight perimeter directions and animate explicit ballistic checkpoints with downward gravity; intermediate completion gets one quick wave and daily completion gets three independently generated waves. Veil and panel timing stay unchanged, and the reduced-motion override still collapses the effect.
- Final completion idempotently records one streak day for `dateKey`; intermediate completion and opening a board do not. A completion immediately after the last recorded Taiwan date extends current streak, while a gap resets current streak to one and preserves longest streak and total completed days. The counters stay off-screen.
- Reload restores elapsed time and paths but intentionally remains paused. This avoids charging time while the page was closed.

The browser clock supplies the Taiwan date. The existing timer update loop also refreshes the final countdown and compares the active date, so a continuously visible completed run automatically becomes the next day's first board at zero. Initial load and a hidden tab becoming visible perform the same changed-date reset.

## Language selection

The rightmost globe header action toggles an anchored single-choice menu. Its rows use locale autonyms and radio semantics: **Automatic** is first, followed by Traditional Chinese (`繁體中文`), English, Simplified Chinese, Japanese, Korean, Spanish, and Brazilian Portuguese. Opening focuses the checked row; Up/Down wrap, Home/End jump, Escape closes and restores focus, Tab closes without trapping focus, and a pointer press outside closes quietly.

On load, a supported `twain:locale:v1` value wins. Otherwise Twain walks `navigator.languages` and `navigator.language` in preference order, canonicalizes each with `Intl.Locale`, and selects the first supported language. `zh-Hant` or TW/HK/MO Chinese resolves to `zh-TW`; other Chinese resolves to `zh-CN`; Portuguese resolves to the available `pt-BR`; unsupported preferences fall back to English. Choosing an explicit row stores its canonical code. Choosing **Automatic** removes the override and immediately reapplies the browser match.

A locale change updates `html[lang]`, metadata/title, localized date, controls, tutorial, progress/completion copy, dialogs, move feedback, cell/board ARIA, and sharing text, then rerenders the current board without changing its puzzle, paths, history, timer, Hint count, or persisted daily record. The brand **Twain** and displayed clue systems `1…`/`A…` remain invariant.

## Analytics consent and events

With no valid `twain:analytics-consent:v2` record, a fixed localized privacy banner is visible at the bottom of the viewport. **Decline** and **Allow analytics** are direct actions; **Privacy details** opens a native modal that distinguishes Twain's bounded custom gameplay outcomes from Google Analytics Enhanced Measurement, names the automatic page/interaction context, and explains the custom-event exclusions. Help contains a persistent **Privacy choices** entry so the current choice is reversible without adding another header action.

A successful choice stores `version`, `state`, and `updatedAt`, hides the banner, updates the modal status, and announces the outcome. A grant uses localStorage and persists across page sessions. A decline removes any grant and uses sessionStorage: reloads in that page session remain declined, while a later page session has no valid record and asks again. If storage fails, the choice is not treated as permission, the banner remains, and analytics stays disabled. A grant can initialize the tag only when the separate build-time configuration is enabled and valid. A decline never initializes it. Revoking an already active tag queues denied consent and reloads, after which the session-denied startup path creates no tag.

The first accepted move or Hint on a fresh stage emits `level_start`; the first stage also emits `daily_run_start`. Hint emits one `hint_used` outcome after its board transition. Solving emits `level_end`, and the final stage also emits `daily_run_complete` after streak transition. Restoring completed play does not replay events. Rejected moves are aggregated into completion mistake counts rather than generating noisy per-move events. Event dispatch is a no-op unless the consented transport is active.

The event builders receive bounded context and aggregate counters only. They never receive path arrays, individual cell targets, puzzle seeds, clue values, names, account identifiers, or free text. [analytics.md](analytics.md) owns the complete parameter dictionary, rollout steps, and analysis caveats.

## Sharing and URL state

The page strips query parameters and fragments from its canonical location. Header Share always opens a native modal dialog and never calls `navigator.share()`. The dialog locally encodes that canonical URL into a black-on-white QR code with medium error correction and a four-module quiet zone, shows the same URL in a read-only selectable field, and identifies numbered dates as **Share Twain #N**.

The header dialog's Copy button first tries secure-context Async Clipboard. Local HTTP and other contexts without that API use a temporary selected textarea plus `execCommand("copy")` as a compatibility fallback. Success briefly changes the button label to **Copied** while leaving the QR dialog open; the off-layout live announcer reports the same result. If automatic copying also fails, the visible URL field remains selected and the instructions explain manual copying; selection and long-press are explicitly permitted inside that field.

Final-result Share calls the Web Share API synchronously within its original user activation; no awaited work may precede `navigator.share()`. Native sharing is attempted only in a secure context, after an optional `canShare()` preflight. A valid Promise opens the platform share sheet. User cancellation (`AbortError`) stays silent; a synchronous exception, non-Promise WebKit result, or other rejection opens the visible sharing fallback instead of trying another activation-gated API after Share has consumed the gesture. When Web Share is unavailable, the same Clipboard/compatibility/manual sequence applies.

For numbered dates, English final-result Share uses `I completed today's Twain #N in mm:ss with <Hint summary>. Can you beat my time?`, where the summary is `no hints`, `1 hint`, or `<k> hints`. Every supported locale owns the equivalent sentence and Hint grammar; copy fallbacks append the canonical URL. A pre-launch device date retains the localized unnumbered identity while preserving the time and Hint summary. Another browser derives the same board set from its current Taiwan date and the deployed generation version regardless of its locale. Historical dates, custom seeds, and stage selection are not URL features.

## Tutorial dialog

Help opens a native localized modal dialog containing the two rule cards, keyboard guidance, and the persistent Privacy choices entry. Header Share and Privacy details use separate localized native modals. Each close control, Escape, and a click on the backdrop dismisses its dialog; focus returns to a stable originating control. Dialogs are outside page flow, so they cannot push the board below the fold. The initial privacy banner is intentionally fixed and adds scroll clearance until a choice is saved.

## Rendering layers

One SVG renders the grid, both routes, walls, and border. HTML overlays render round/square clues, shared hit targets with localized semantic labels and input, and the completion veil/panel over the board. Internal integer clues remain unchanged: line `a` displays numbers and line `b` maps to `A…Z`, `AA…`. A versioned seed derivation selects a curated contrasting gradient pair. Routes are never used as the hit-test surface. Stable pure-rule outcome kinds are mapped to localized copy in `main.js`; non-completion feedback goes only to an off-layout `aria-live` announcer and visual board/control states.
