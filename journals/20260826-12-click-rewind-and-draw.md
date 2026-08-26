---
date: 2026-08-26
sequence: 12
topic: click-rewind-and-draw
supersedes: ["20260825-08-mobile-path-palette-ux.md"]
---

# Separate intentional click rewinds from safe drag collisions

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain already supported cell-by-cell clicks and interpolated pointer drawing, but pointer down immediately attempted the starting cell and every drag collision with the active route entered the ordinary move rule. The earlier mobile interaction decision deliberately rejected route-body rewinds because a forward drag could erase progress after an imprecise collision. That safety outcome remained correct, but its broader conclusion—that explicit Undo was the only way to remove a suffix—also prevented an intentional click on a route cell from serving as a convenient redraw point.

The desired interaction now distinguishes intent: a click/tap on an existing route should rewind directly to that cell, a forward drag that touches its route must remain unchanged and quiet, and a click on an unoccupied cell in the active tail's row or column should draw through every intermediate cell.

## Decision process

- Classify the complete pointer gesture by cell transitions rather than elapsed time or a pixel-distance threshold. Pointer down records the start and selects any clue/path owner but does not mutate a path. Leaving the start cell makes the gesture a drag permanently; pointer up without doing so is a click/tap. Pointer cancellation never becomes a click.
- Keep drag-body collisions out of the move engine. A drag target or interpolated cell already present in the active route is a quiet no-op, including the immediate predecessor and any older body cell. This preserves the earlier protection against accidental deletion.
- Add the pure `rewindToPathCell()` transition for the explicit click intent. It validates the line and target, returns a new path map containing the prefix through that target, leaves the input paths untouched, and records one history snapshot so one Undo restores the removed suffix.
- Route unoccupied click targets through the same orthogonal interpolation and `applyMove()` calls as pointer drawing. Walls, clue order, clue ownership, occupancy, line completion, timer start, persistence, and completion therefore keep their existing rule boundary; interpolation stops at the first rejected cell.
- Reject re-enabling body truncation inside ordinary `applyMove()`. That would again make drag and keyboard collisions destructive. Reject timing-based tap detection because a long stationary press is still intentional while a fast cross-cell drag is still drawing. Reject direct DOM-side path slicing because it would bypass immutable rules, history, persistence, and completion derivation.

## Outcome

- Clicking or tapping any earlier cell of either drawn route selects its owner and rewinds directly to the selected cell. Clicking the current tail remains a quiet no-op.
- Clicking an unoccupied orthogonally aligned target draws the active route through every legal intermediate cell; adjacent click-to-step remains intact and non-adjacent diagonal clicks remain quiet.
- Once a pointer crosses a cell boundary, every collision with the active route is a quiet no-op and cannot rewind it, even if the pointer returns to its starting cell before release.
- Mouse and touch use the same Pointer Events state machine. Keyboard arrows continue to use ordinary one-cell `applyMove()` semantics, including immediate-predecessor backtracking.
- Semantic interaction, architecture, product, and quality contracts now describe the split intent. The Visual QA procedure and harness permanently cover orthogonal click drawing, direct path-click rewind with one-action Undo, predecessor/older-body drag no-ops, and touch-tap rewind.

## Trade-offs and consequences

Tap moves now commit on pointer up instead of pointer down. A drag that starts on an unoccupied cell applies that start on the first cross-cell transition, preserving continuous drawing without guessing from time or sub-cell jitter.

An orthogonal click is still represented as its accepted cell transitions, so chronological Undo removes those newly drawn cells one at a time just as it does after a drag. A direct rewind is one explicit rule transition, so one Undo restores its entire removed suffix. This asymmetry follows the correction intent rather than the physical number of cells affected.

## Verification

- `npm test` passes; a concise `node --test --test-reporter=dot` confirmation exits 0 with all 80 tests. New pure-rule coverage proves direct suffix removal, input immutability, preservation of the other line, and quiet tail/non-path outcomes.
- `npm run visual-qa -- --output /private/tmp/twain-click-rewind-qa-final-20260826` exits 0 in Microsoft Edge with 40 browser checks, 43 temporary captures, and no runtime or console errors. Assertions prove a multi-cell orthogonal mouse click, direct mouse path rewind, one-action Undo restoration, quiet drag collisions with both predecessor and older body cells, six-cell mobile touch drawing followed by path-tap rewind, and the unchanged complete daily matrix.
- The final `1440x1000-daily-click-rewind.png` and `390x844-daily-ultra-tap-rewind.png` captures were inspected at original resolution. Route caps, clue visibility, walls, active-line contrast, board containment, and controls remained clean; no rendered defect or recapture cycle was needed.
- `node --check` passes for `src/main.js`, `src/game.js`, and the Visual QA harness. Temporary screenshots remain outside the repository.

## Follow-ups

No backlog item was added. Physical iOS gesture verification remains part of the existing broader device matrix rather than a new risk created by this change.
