# Puzzle Generation

## Constructive pipeline

For each candidate, the generator:

1. Builds a full-grid serpentine Hamiltonian path.
2. Randomizes it with seeded backbite moves. Each move adds an endpoint-to-interior edge and removes the corresponding cycle edge, preserving one Hamiltonian path over all cells.
3. Splits the path at a seeded point between 40% and 60%. The prefix becomes line `a`; the reversed suffix becomes line `b`, so the two lines start at the original outer endpoints and finish on adjacent cells at the split.
4. Chooses ordered clue indices for each line, always including its endpoints. The profile's total clue budget is divided proportionally, with at least two clues per line.
5. Places a required wall between the adjacent final endpoints. Remaining walls are sampled only from orthogonal edges absent from both witnesses.
6. Validates the candidate before difficulty analysis.

The witnesses remain a constructive proof of solvability. Validator failure is treated as a generator defect and throws.

## Solver-calibrated selection

`generatePuzzle()` constructs a fixed candidate pool and asks `analyzePuzzleDifficulty()` to search each candidate without reading its witnesses. The solver:

1. starts from the visible first clues;
2. extends the line with the fewest legal moves;
3. respects clue ownership/order, walls, final endpoints, and full-board occupancy;
4. prunes disconnected regions, insufficient-degree cells, and unreachable future clues;
5. records first-solution nodes, decision states, failed branches, forced moves, and a profile-bounded sample of solutions under fixed limits.

The score weights first-solution work and failed branches, then discounts effort by the square root of the observed solution-count floor. A search that reaches either bound is charged at least the configured solution cap, so incomplete enumeration cannot masquerade as scarcity. Profiles select progressively higher score quantiles. Clue and wall counts shape candidates; they are not assumed monotonic measures of difficulty.

If every candidate reaches its node bound before finding a solution, generation deterministically returns candidate zero. Its witness still proves solvability, but the fallback is not solver-calibrated; fixed cohort tests are intended to detect budgets that make this common.

## Determinism

The string `(puzzleVersion, difficulty, seed, candidateIndex)` tuple is hashed into a small deterministic PRNG. Candidate count, search limits, scoring, and quantile selection are part of output semantics. No wall-clock timeout participates, so device speed cannot change the selected board.

Daily v2 first hashes `twain-daily:v2:<Taiwan YYYY-MM-DD>:schedule` to sample three to five unique profiles and shuffle them. Each selected profile then receives `twain-daily:v2:<Taiwan YYYY-MM-DD>:<difficulty>` as its seed. Only the active daily stage is generated; future selected stages are generated synchronously while the timer is paused after Continue.

## Difficulty profiles

| Profile | Grid | Total clues | Walls | Candidates | Selection quantile | Node limit | Solution cap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 5×5 | 10 | 1 | 5 | 0.65 | 5,000 | 4 |
| Medium | 6×6 | 10 | 3 | 4 | 0.80 | 10,000 | 4 |
| Hard | 7×7 | 11 | 6 | 7 | 0.90 | 25,000 | 4 |
| Extra | 8×8 | 14 | 10 | 6 | 0.95 | 50,000 | 8 |
| Ultra | 10×10 | 20 | 18 | 6 | 1.00 | 100,000 | 12 |

A fixed ten-seed verification cohort currently produces median solver scores of approximately `44 → 109 → 552 → 1,081 → 8,045`. This establishes ordering for regression purposes, not a human-time scale. Extra deliberately fills the gap between Hard and the 10×10 profile; the earlier 10×10 Extra tuning is now Ultra.

## Known limitations

The generator proves existence, not uniqueness. Its witness partition is one answer, not a per-line quota; another valid partition must be accepted. Solver score is reproducible and cohort-calibrated but remains a model of search effort. The current Ultra profile targets a roughly two-minute challenge, and all five human-perceived bands still require broader playtest validation. Synchronous Ultra generation at initial load or a transition also requires measurement on low-end physical phones before the public preview can graduate to a stable release.
