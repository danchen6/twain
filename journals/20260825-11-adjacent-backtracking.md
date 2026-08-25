---
date: 2026-08-25
sequence: 11
topic: adjacent-backtracking
supersedes: ["20260825-08-mobile-path-palette-ux.md"]
---

# Backtrack along the tail without letting the line bite its body

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The earlier occupied-cell safeguard rejected every move onto the active path. It prevented a forward drag from jumping to an older body cell and deleting a large suffix, but it also removed the expected gesture of reversing naturally along the line. The intended distinction is not “visited versus unvisited”; it is “the immediate predecessor versus any older body cell.”

This corrects the blanket rewind rejection in `20260825-08-mobile-path-palette-ux.md`. Seed-derived palettes, mobile zoom policy, global chronological Undo, and rejection of non-predecessor body collisions remain unchanged.

## Decision process

- Treat only the active tail's immediate predecessor as a legal backtrack target. The transition removes exactly one tail cell and returns a normal accepted move without mutating either input path map.
- Apply the same rule repeatedly, so a held pointer or keyboard arrows can reverse through several cells one at a time.
- Continue rejecting every older active-line cell, including one orthogonally adjacent to the tail. This is the snake-body collision that previously caused a surprising large rewind.
- Keep pointer-down on an occupied path selection-only. Pointer backtracking begins at the current tail and moves through predecessors, avoiding destructive edits when a player merely selects the other line.
- Preserve chronological history for accepted backtracks. Undo after a backtrack restores the removed cell; a rejected body collision creates no history entry.

## Outcome

- Players can drag backward along either line without reaching for Undo after every cell.
- A gesture onto an older path segment never truncates the intervening suffix.
- Pointer, touch, and keyboard adapters continue to share the same pure `applyMove()` rule.
- Invalid feedback now directs players to backtrack along the route one cell at a time.

## Trade-offs and consequences

A fast pointer jump that skips over predecessors is rejected rather than inferred as a multi-cell backtrack. Requiring the gesture to trace the existing route is slightly more deliberate, but it makes reversal visually unambiguous and preserves the body-collision safeguard. A tap directly on an occupied cell remains selection-only; drag from the tail or use Undo to edit.

## Verification

- `npm test`: 43/43 tests passed. Rule coverage proves repeated predecessor backtracking, reopening a completed line from its final clue, immutability, and rejection of a physically adjacent older body cell.
- The final `npm run visual-qa` run passed 28/28 checks in Microsoft Edge with no runtime or console errors and produced 21 temporary screenshots.
- The rendered pointer flow shortened an eight-cell route to six by tracing two predecessors, then Undo restored the latest removed cell. A separate adjacent body collision preserved the complete prefix, and the following Undo removed only the latest accepted extension.
- The final backtracking and body-collision captures were opened at original resolution; the route geometry matched the asserted state and no visual artifact remained.
- Changed JavaScript syntax and `git diff --check` passed.
