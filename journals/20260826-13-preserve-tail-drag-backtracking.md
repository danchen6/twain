---
date: 2026-08-26
sequence: 13
topic: preserve-tail-drag-backtracking
supersedes: ["20260826-12-click-rewind-and-draw.md"]
---

# Preserve tail-first drag backtracking alongside explicit click rewind

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The click-rewind change in `20260826-12-click-rewind-and-draw.md` incorrectly classified every drag contact with the active route as a quiet no-op. That protected against accidental older-body collisions but also removed the established “倒退嚕” gesture: tracing the tail through its immediate predecessors must backtrack one cell at a time.

This was a working-tree regression and was neither committed nor deployed. It was not caught before the prior handoff because memory retrieval stopped at the blanket rejection in `20260825-08-mobile-path-palette-ux.md` instead of continuing to the newer superseding decision in `20260825-11-adjacent-backtracking.md`. The existing browser assertion that tail-first dragging shortened an eight-cell path to six was also changed rather than treated as contract evidence. The affected scope was the uncommitted pointer adapter, its new documentation, and the accuracy of the prior handoff; the pure `applyMove()` predecessor rule itself remained correct.

## Decision process

- Reaffirm `20260825-11-adjacent-backtracking.md`: the distinction is immediate predecessor versus older non-predecessor body, not simply existing versus unvisited cell.
- During a drag, pass the active path's immediate predecessor to `applyMove()`. Each accepted pointer transition removes exactly one tail cell, so a held mouse or touch gesture can continue backward along consecutive predecessors.
- Quietly ignore any older non-predecessor path target in the pointer adapter. Do not call `applyMove()` for that collision, do not announce an error, and never infer deletion of the skipped suffix.
- Keep stationary click/tap semantics from the superseded journal: any earlier route cell invokes the explicit pure `rewindToPathCell()` transition, while clicking the current tail is a quiet no-op.
- Keep orthogonal click drawing routed cell by cell through `applyMove()`. The correction changes only drag contact with the immediate predecessor.
- Record the complete behavior as a semantic invariant matrix in `docs/interaction.md`, with separate rows for click/tap, drag, and keyboard against the tail, immediate predecessor, and older body. Future interaction work must preserve the matrix and its browser regressions.

## Outcome

- Mouse and touch can again drag the line head backward through immediate predecessors one cell at a time.
- Dragging into any older non-predecessor body cell remains a quiet no-op, so the original accidental-suffix-deletion safeguard still holds.
- Clicking/tapping an earlier route cell still rewinds directly to it, and orthogonal click/tap drawing still fills legal intermediate cells.
- Undo after a one-cell drag backtrack restores that cell. Undo after a direct click rewind restores the entire suffix removed by that single explicit transition.
- `docs/interaction.md` now owns the correction-gesture baseline explicitly rather than relying on readers to reconstruct it from multiple historical journals.

## Trade-offs and consequences

A fast drag jump to an older body cell does not infer skipped predecessor transitions; it is ignored. Players must trace the actual route backward, which makes destructive correction visually unambiguous while preserving fluid “倒退嚕” behavior.

The pointer adapter intentionally differs from raw keyboard feedback for older-body targets: drag collisions are quiet because they commonly arise from imprecise motion, while a keyboard move is a discrete intent and remains a rejected `applyMove()` result. Both preserve the paths.

## Verification

- `npm test`: 80/80 tests pass. Pure-rule coverage continues to prove repeated immediate-predecessor backtracking, older-body rejection, explicit direct rewind, immutability, and Undo behavior.
- `npm run visual-qa -- --output /private/tmp/twain-drag-backtracking-final-20260826`: 40 browser checks and 44 temporary captures pass in Microsoft Edge with no runtime or console errors.
- Desktop pointer assertions draw eight cells, click-rewind to six, Undo to eight, drag backward through two immediate predecessors to six, and Undo the latest backtrack to seven. A separate non-predecessor collision leaves both progress and accessible status unchanged.
- Mobile emulation touch-draws six Ultra cells, tail-drags through two predecessors to four, then touch-taps an earlier path cell to rewind directly to three.
- `1440x1000-daily-click-rewind.png`, `1440x1000-daily-drag-backtracking.png`, and `390x844-daily-ultra-tap-rewind.png` were inspected at original resolution. Route geometry, rounded caps, clue and wall visibility, active-line contrast, board containment, and controls remained clean.
- `node --check` passes for the runtime and Visual QA harness, and `git diff --check` passes. Temporary screenshots remain outside the repository.

## Follow-ups

No backlog item was added. The existing physical-iOS gesture verification item remains the only device-specific gap.
