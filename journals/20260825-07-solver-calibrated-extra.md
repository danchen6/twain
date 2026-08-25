---
date: 2026-08-25
sequence: 07
topic: solver-calibrated-extra
supersedes: ["20260824-01-project-foundation.md", "20260825-02-twain-mode.md"]
---

# Calibrate difficulty by bounded search and make Extra a stretch band

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The original Easy, Medium, and Hard profiles treated board size, clue count, and wall count as difficulty labels. Those inputs were not monotonic: fewer clues can admit more successful routes, while extra walls can expose forced corridors. This supersedes the foundation's conclusion that solver-calibrated difficulty remained deferred and Twain mode's version-2/current-difficulty conclusion; witness-first solvability, non-unique answer acceptance, and single-player scope remain unchanged.

An initial solver-ranked 8×8 Extra prototype still took roughly one minute for the project's first human calibration player. The requested target was closer to two minutes. That feedback also exposed a proxy mismatch: many high-effort 8×8 boards reached the solution-count cap quickly, so solver backtracking did not necessarily mean that a human had few successful choices.

## Decision process

- Keep witness-first construction so every candidate is valid and solvable before analysis. A solver filters quality; it does not become the source of solvability.
- Analyze fixed candidate pools with a deterministic bounded search that reads only visible clues and walls, never `lines[].solution`. Measure first-solution nodes, decisions, failed branches, forced moves, and capped solution density.
- Score first-solution effort and backtracking, discounted by the square root of the observed solution-count floor. Treat a node- or solution-bounded search as having at least the configured solution cap so incomplete enumeration cannot look uniquely scarce.
- Use fixed node and solution limits instead of wall-clock time. Device speed can affect latency but cannot change seeded output.
- Reject a purely more-extreme clue/wall profile. 9×9 experiments with more constraints often reduced solution count by creating forced corridors and lowered search effort.
- Reject a much larger candidate pool. It improved tail selection by spending close to or beyond one second synchronously on desktop, which is a poor mobile trade-off.
- Make Extra 10×10 with 20 total clues, 18 walls, four candidates, a 100,000-node bound, and a 12-solution cap. The larger reasoning surface produced a more reliable jump while keeping candidate work bounded.
- Advance the puzzle format to version 3 for Extra and solver-ranked selection. Because the game remains unpublished, do not retain a version-2 compatibility branch.

## Outcome

- The UI and URL model now expose Easy, Medium, Hard, and Extra in both Twain and Classic modes.
- `src/solver.js` owns dependency-free bounded analysis, pruning, solution-density sampling, and scoring without inspecting constructive witnesses.
- `generatePuzzle()` builds deterministic candidate pools and selects progressively higher score quantiles; Extra selects the highest of four 10×10 candidates.
- Fixed cohort tests require median score to rise across every band and Extra to remain at least five times Hard in both modes.
- Extra is a roughly two-minute stretch target, not a promised solve duration. Non-unique player solutions and alternate Twain partitions remain valid.
- The Visual QA procedure now exercises all four difficulty controls plus 10×10 desktop, narrow-mobile, and touch states.

## Trade-offs and consequences

The stronger Extra band uses 100 cells, so 320px cells are smaller than the other modes. Rendered inspection confirmed that Number/Letter shapes, glyphs, walls, and touch routes remain distinguishable, but 10×10 is the practical mobile-density ceiling for the current layout.

Extra generation is intentionally synchronous for implementation simplicity. Across the 30-seed desktop audit, median generation was 501 ms for Twain and 436 ms for Classic; P90 was 801 ms and 628 ms respectively. Low-end phone latency remains an accepted pre-launch risk rather than justification for adding a worker before evidence demands it.

Solver score remains an engineering proxy. The first player's 8×8 result informed the 10×10 change, but a broader human cohort must validate whether the new profile actually clusters around the intended solve time.

## Verification

- `npm test`: 39/39 tests passed in 78.8 seconds. Coverage includes deterministic generation, profile contracts, solver fixtures, witness independence, bounded search, fixed-cohort band separation, game rules, static deployment, and property cohorts across both modes and all four difficulties.
- A 30-seed audit with the same seeds for Hard and Extra found Twain median first-solution decisions of 63 versus 2,069; the easiest audited Twain Extra still required 688. Classic medians were 72 versus 1,670; the easiest audited Classic Extra required 454. No audited Extra analysis reached its 500,000-node verification bound.
- `npm run visual-qa`: 25/25 browser checks passed with no runtime or console errors. All 17 captures were inspected across 1440×1000, 768×1024, 390×844, and 320×800, including 10×10 Extra fresh and touch states.
- The 10×10 board remained above the fold at every maintained viewport. A five-cell Extra touch route reached `5/100` without scrolling the 390px page. No visual defect was found, so no correction/recapture cycle was required.

## Follow-ups

- Validate the roughly two-minute Extra target with more people, solve-time distributions, mistakes, and Hint usage before launch.
- Benchmark synchronous Extra generation on representative low-end phones; introduce a worker or lower the bounded-search budget only if measured input latency is unacceptable.
