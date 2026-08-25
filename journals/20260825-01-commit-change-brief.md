---
date: 2026-08-25
sequence: 1
topic: commit-change-brief
supersedes: []
---

# Require a change brief in every commit

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

A semantic subject makes a commit easy to scan, but it often does not preserve enough detail to understand what actually changed without opening the diff. The project therefore needs a small, consistent amount of explanatory context in every commit message.

## Decision process

- Making the subject longer would weaken scanability and still mix intent with implementation detail.
- Requiring a full narrative for every commit would add noise, especially for small changes.
- A concise body after the subject preserves both properties: a conventional one-line summary and a brief of the material changes, with motivation or impact only when useful.
- Procedural guidance remains sufficient; a commit-message linter is still unnecessary.

## Outcome

Every commit must contain:

1. a semantic/Conventional Commit subject;
2. a brief body summarizing the material changes without merely repeating the subject; and
3. any required trailers, including `Co-authored-by:` for coding-agent contributions.

The brief is required even for a small commit, but it should remain concise. The operational rule lives in `AGENTS.md` and the repeatable enforcement step lives in the checkpoint skill.

## Verification

The operational and procedural instructions agree on the required subject, change brief, optional rationale or impact, and agent trailer. The repository test suite passes unchanged; no rendered UI surface is affected.
