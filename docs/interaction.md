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
  stageCompleted,
  dailyComplete
}
```

`palette` is derived from `puzzle.seed` and affects presentation only. Rule transitions return new path maps; they do not mutate the puzzle or existing paths. History snapshots include both paths and the active line, so Undo is global and chronological across line switches.

The versioned localStorage record omits the deterministic schedule, regenerated puzzle, palette, transient `runningSince`, and derived completion flags. Restore re-derives the schedule, accepts only its current Taiwan date/stage, and replays every path and history snapshot through `applyMove()`. Stale, malformed, or illegal records reset to today's first selected stage.

## Cell intent

All input adapters resolve to an active line plus one target cell and call `applyMove(puzzle, paths, activeLineId, target)`.

- Empty line: only that line's first clue (`1` or `A`) can start.
- Existing active-line cell: the current tail is a quiet no-op. Moving to its immediate predecessor removes exactly the tail; repeating backtracks one cell at a time. Any older body cell is rejected without changing either line.
- New cell: it must be adjacent to the active tail, absent from both lines, not wall-separated, not owned as a clue by the other line, and not an out-of-order clue.
- Final clue: a line may finish before the board and cannot extend again unless undone. Completion waits for both valid lines to fill the board.
- Completion is evaluated after every accepted extension.

There is no visible line selector. Starting a pointer gesture on either line's clue or existing path selects that line automatically; pointer-down on an occupied path selects without applying a move. Pointer down supports tap-to-step and held pointer movement supports drawing. Keyboard `N` selects Number and `L` selects Letter; arrows move relative to the active tail; Enter/Space starts; Backspace undoes; `H` hints; `R` clears.

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
- Reload restores elapsed time and paths but intentionally remains paused. This avoids charging time while the page was closed.

The browser clock supplies the Taiwan date. The existing timer update loop also refreshes the final countdown and compares the active date, so a continuously visible completed run automatically becomes the next day's first board at zero. Initial load and a hidden tab becoming visible perform the same changed-date reset.

## Sharing and URL state

The page strips query parameters and fragments from its canonical location. Both click handlers call the Web Share API synchronously within their original user activation; no awaited work may precede `navigator.share()`. Native sharing is attempted only in a secure context, after an optional `canShare()` preflight. A valid Promise opens the platform share sheet. User cancellation (`AbortError`) stays silent; a synchronous exception, non-Promise WebKit result, or other rejection opens the visible sharing fallback instead of trying another activation-gated API after Share has already consumed the gesture.

When native sharing is unavailable, Twain tries the secure-context Async Clipboard API during the same click. Local HTTP and other contexts without that API use a temporary selected textarea plus `execCommand("copy")` as a dependency-free compatibility fallback. Success produces a visible, transient copied toast. If automatic copying also fails, a modal keeps the share text selected and explicitly permits selection/long-press so the user can copy manually; its Copy button supplies a fresh activation for retrying.

Header Share uses the canonical base URL. Final-result Share adds `I've completed today's Twain in mm:ss. Can you beat my time?` and uses the full sentence plus URL for every copy fallback. Another browser derives the same board set from its current Taiwan date and the deployed generation version. Historical dates, custom seeds, and stage selection are not URL features.

## Tutorial dialog

Help opens a native modal dialog containing the two rule cards and keyboard guidance. The close control, Escape, and a click on the backdrop dismiss it; native dialog focus restoration returns keyboard users to Help. The tutorial is not part of the page flow, so it cannot push the board below the fold.

## Rendering layers

One SVG renders the grid, both routes, walls, and border. HTML overlays render round/square clues, shared hit targets for semantic labels and input, and the completion veil/panel over the board. Internal integer clues remain unchanged: line `a` displays numbers and line `b` maps to `A…Z`, `AA…`. A versioned seed derivation selects a curated contrasting gradient pair. Routes are never used as the hit-test surface. Non-completion feedback goes only to an off-layout `aria-live` announcer and visual board/control states.
