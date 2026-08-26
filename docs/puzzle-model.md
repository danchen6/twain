# Puzzle Model

## Schema

`generatePuzzle(difficulty, { seed })` returns:

```js
{
  version: 4,
  difficulty: "easy" | "medium" | "hard" | "extra" | "ultra",
  seed: "stable internal string",
  rows: Number,
  cols: Number,
  lines: [
    {
      id: "a" | "b",
      clues: [{ value, row, col, solutionIndex }],
      solution: [{ row, col }]
    }
  ],
  walls: [{ a: { row, col }, b: { row, col } }]
}
```

Coordinates are zero-based. Every product puzzle contains lines `a` then `b`. Line `a` displays numeric clues; line `b` maps the same internal positive integers to spreadsheet-style letters. Each `solution` is a constructive witness used for deterministic hints and validation. Witness cells and line lengths are not rendered as constraints.

## Executable invariants

`validatePuzzle()` enforces:

- positive integer dimensions and a declared difficulty;
- exactly two lines in `a, b` order;
- at least two clues per line, valued consecutively from `1`;
- every clue and witness cell is in bounds;
- clue `solutionIndex` values strictly increase and point to the matching witness cell;
- each witness is orthogonally contiguous and non-repeating;
- witnesses do not share cells and their union covers the board exactly once;
- every wall joins two in-bounds orthogonal neighbors, is unique, and crosses no witness edge.

Game completion applies the corresponding player-path invariants without comparing path lengths to the witnesses. Each path must begin/end on its own first/final clues, follow all clues in order, stay orthogonal and wall-safe, never repeat/share a cell, and together cover every board cell.

## Canonical keys

- Cell key: `"row,col"`
- Undirected edge key: lexically sorted cell keys joined by `|`

All wall, uniqueness, and route checks use these helpers so reversed endpoints are equivalent.

## Version and determinism

Version 4 removes the product mode field and makes every generated board a two-line Twain puzzle. It also defines five profiles: 8×8 Extra sits between Hard and the promoted 10×10 Ultra profile. The unpublished project intentionally carries no compatibility branch for earlier schemas.

Generator reproducibility is defined by `(version, difficulty, seed)`. Candidate index is an internal deterministic stream component. Changing output for an existing tuple requires another deliberate puzzle-version decision.

The daily layer has its own version because scheduling, date-to-seed, and persistence semantics can change independently. Daily v2 deterministically samples and shuffles three to five unique profiles from the full difficulty catalog, then derives `twain-daily:v2:<YYYY-MM-DD>:<difficulty>` for each selected stage. The canonical page URL exposes neither the schedule nor these internal seeds.

Public numbering is a separate, unversioned identity contract: Taiwan date `2026-08-26` is Twain #1 and each later date advances by one. The number is derived from the validated date key but never enters a puzzle seed, schema, or persisted record; changing a generation version therefore does not renumber an existing day.
