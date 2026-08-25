---
date: 2026-08-24
sequence: 1
topic: project-foundation
supersedes: []
---

# Project foundation

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

Twain began from the frustration that a daily number-path game offers only one board. The product needed an independent identity, unlimited original boards, selectable difficulty, guaranteed solvability, and a pure Web UI deployable unchanged to GitHub Pages. The canonical subtitle is **Never the twain shall meet**.

## Decision process

- A framework and build pipeline could accelerate component work, but would add dependency and deployment surface before the interaction model was proven. Browser-native HTML, CSS, and ES modules were sufficient.
- Generating arbitrary clues and asking a solver to discover whether a board works risks slow or failed generation. Constructing a complete Hamiltonian witness first makes solvability an invariant.
- Hiding the witness is not meaningful in shipped browser source. Keeping it in the puzzle object makes validation and deterministic hints straightforward.
- Twain and its subtitle provide a playful vocabulary for a non-crossing path while remaining distinct from the game that inspired the mechanics. Copying trademarks, assets, or daily boards would create needless identity and IP risk.

## Outcome

- Use a dependency-free, build-free static runtime.
- Use **Twain** and **Never the twain shall meet** consistently across UI, accessibility labels, browser metadata, documentation, and package metadata.
- Generate a seeded Hamiltonian witness, then project ordered clues and only non-witness walls.
- Store the witness client-side for validation and hints.
- Accept every valid full path, including alternate solutions.
- Support pointer, touch, keyboard, drag-back, Undo, Clear, Hint, reproducible URLs, and completion feedback through shared pure game rules.
- Keep the project unofficial and independently branded, including a `T` mark and favicon.

## Consequences

Solvability is guaranteed and generation is fast. Unique solutions and solver-calibrated human difficulty are not guaranteed; that work remains in `BACKLOG.md`. The witness is inspectable in browser source, which is acceptable because it is a correctness artifact rather than a security boundary.

## Verification at the checkpoint

Rule, property, identity, and static-entry tests pass across all difficulty profiles, including repeated witness playthroughs. Rendered browser verification covers the fresh, invalid, drawing, Hint correction, focus, completion, touch, narrow-width, and reduced-motion states.
