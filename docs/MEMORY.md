# Project Memory

The repository models project knowledge after four kinds of human memory. Each layer answers a different question and has a different lifecycle; do not collapse them into one catch-all document.

| Memory | Location | Answers | Lifecycle |
| --- | --- | --- | --- |
| Semantic | `docs/` | What is true now? | Agent-maintained after every change; freely refactor stale knowledge into accurate current truth. |
| Episodic | `journals/` | How and why did we reach a conclusion? | Append-only. Never edit an existing entry; create a newer entry that explicitly supersedes it. |
| Backlog | `BACKLOG.md` | Which open questions, carried risks, or deliberately deferred items remain? | Mutable. Add genuine deferred work and remove it when resolved or promoted. |
| Procedural | `.agents/skills/` | How do agents repeat a project-specific workflow reliably? | Agent-maintained when the procedure itself changes. |

`AGENTS.md` is the operational entrypoint. `README.md` is the short human-facing introduction. This file is the memory router.

## Session retrieval

1. Read `AGENTS.md`, this file, and `BACKLOG.md`.
2. Read [product.md](product.md), [architecture.md](architecture.md), and [quality.md](quality.md) for any non-trivial change.
3. Read the domain-specific semantic documents affected by the task.
4. Search `journals/` by topic when rationale or a previous trade-off matters. Read matching entries oldest-to-newest because the newer entry wins when it names an older entry under `supersedes`.
5. Load the relevant skill from `.agents/skills/` before performing a repeatable project workflow.

Do not load every journal by default. Episodic memory is evidence and history, not the fastest statement of current truth.

## Semantic memory index

| Document | Current-truth ownership |
| --- | --- |
| [product.md](product.md) | Product identity, rules, scope, experience contract, and IP boundary |
| [architecture.md](architecture.md) | Runtime structure, module ownership, data flow, dependency policy, deployment, and repository knowledge layout |
| [design.md](design.md) | Visual language, page anatomy, responsive behavior, interaction states, and visual acceptance criteria |
| [puzzle-model.md](puzzle-model.md) | Puzzle schema, keys, compatibility, and executable invariants |
| [generation.md](generation.md) | Construction algorithm, determinism, difficulty profiles, and generator limitations |
| [interaction.md](interaction.md) | Session state, move semantics, input mapping, hints, timer, and rendering layers |
| [analytics.md](analytics.md) | Consent behavior, streak semantics, GA event schema, rollout, data boundaries, and analysis guidance |
| [quality.md](quality.md) | Automated checks, visual QA, release gate, and known verification gaps |

Keep semantic documents small and single-purpose. Add a new topic only when new knowledge has no existing owner, then update this index in the same change.

## After every change

Use `.agents/skills/checkpoint/SKILL.md`. Its memory obligations are binding:

1. Compare the implementation with every affected semantic document. Update anything that would otherwise misstate present reality.
2. Create exactly one new `journals/YYYYMMDD-NN-slug.md` for the logical change. A discussion that reaches a project decision is itself a logical memory change even when no code changes. Record context, reasoning, rejected alternatives, outcome, and verification. Never modify a pre-existing journal.
3. If the conclusion changes earlier reasoning, link the older entry under `supersedes`; the old entry remains untouched.
4. Add or remove `BACKLOG.md` items only when the change creates, resolves, or deliberately carries deferred work. In-flight task status belongs in the working tree, branch, or PR—not the backlog.
5. Update or add a skill only when a reusable procedure changed. Do not encode one-off task details as procedural memory.

## Conflict resolution

- Semantic memory must describe current accepted truth. Code and tests are evidence, not automatic authority: when they disagree with docs, determine whether implementation or intent is wrong and repair both together.
- Episodic memory is never corrected in place. A later journal explains the correction and supersedes the earlier conclusion.
- Backlog items do not override semantic contracts. Deferring a required invariant requires an explicit new decision journal and corresponding semantic change.
- Skills describe process, not product truth. Product and architecture contracts remain in `docs/`.
