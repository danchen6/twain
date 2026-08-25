---
date: 2026-08-24
sequence: 2
topic: project-workflow
supersedes: []
---

# Establish project memory, quality, and commit workflows

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The repository needs compact current truth, durable reasoning, explicit deferred work, repeatable agent procedures, rendered UI evidence, and reviewable Git history without adding runtime or tooling dependencies.

## Decision process

- One mutable document would mix present truth, history, backlog, and procedure. Four lifecycle-specific layers keep retrieval and maintenance predictable.
- Rendered correctness cannot be inferred from Node tests. A project-owned Chromium/CDP harness makes the required browser matrix repeatable even when an agent's interactive browser surface is unavailable.
- Automated interaction assertions still cannot judge hierarchy or visual polish, so temporary screenshots must be inspected by a person or agent; committed pixel baselines remain deferred.
- Semantic/Conventional Commit subjects improve scanning and rollback, but a commit-message linter would add friction without improving the product.
- Agent-authored commits should identify the agent's material contribution through the standard `Co-authored-by:` trailer. Distinct workspace changes may become separate commits when that improves review or reversibility.

## Outcome

- `docs/` owns mutable semantic truth, `journals/` owns immutable episodes, `BACKLOG.md` owns deferred work, and `.agents/skills/` owns repeatable procedures.
- `checkpoint` reconciles implementation, tests, memory, backlog, and requested commits before handoff.
- `npm run visual-qa` serves a nested project path, drives a fixed puzzle in local Edge/Chrome/Chromium, asserts pointer/touch/keyboard and responsive behavior, and writes temporary screenshots for inspection without a package dependency.
- Agent-created commits use semantic subjects, may be split into coherent units when useful, and always carry the contributing agent's canonical `Co-authored-by:` trailer. Enforcement remains procedural rather than lint-based.

## Trade-offs and consequences

The local browser harness requires an installed Chromium-family executable and is not yet provisioned in CI. Journals become immutable after this initial baseline, so later corrections must be new linked episodes rather than rewrites.

## Verification

The Node suite, local nested-path HTTP load, deterministic browser interaction matrix, responsive captures, reduced-motion check, and browser error check all pass. The generated screenshots are inspected against `docs/design.md` before the baseline is committed.
