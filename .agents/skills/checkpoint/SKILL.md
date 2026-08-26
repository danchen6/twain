---
name: checkpoint
description: Close out every logical change in this repository by running quality gates, reconciling semantic memory and backlog, and creating a new immutable journal. Use before declaring work complete, handing it off, or committing it.
---

# Checkpoint

Nothing is complete until implementation, verification, and all four memory layers agree. Run this loop after the work is functionally finished.

## 1. Establish the change boundary

Inspect the working tree and distinguish this change from pre-existing user work. Do not absorb, overwrite, stage, or commit unrelated changes. Identify the product, architecture, design, model, interaction, and deployment surfaces affected.

If the logical change modifies the shipped app surface—`index.html` other than its release literal, `styles.css`, `manifest.webmanifest`, `src/`, `assets/`, or `vendor/`—run `npm run release:bump` exactly once after the app source is final and before the gates. A version-only corrective revision may also use the command. Do not advance the app revision for documentation, tests, workflow, scripts, skills, or journals alone, and do not advance it again when retrying the same source revision. The CI base comparison is the final guard against a missing, stale, or duplicate transition.

## 2. Run the relevant gates

Always run:

```sh
npm test
```

Run focused syntax or local-server checks when the changed surface warrants them. Fix failures and rerun the affected gates. Do not weaken a gate to make the checkpoint pass.

For anything a user can see, invoke `.agents/skills/visual-qa/SKILL.md` before continuing. If rendered-browser verification is unavailable, keep the checkpoint honest: record the precise gap in the new journal and final handoff.

## 3. Reconcile semantic memory

Read `docs/MEMORY.md`, then compare the change with every affected semantic document. Update current truth in the same change when architecture, contracts, schema, commands, visuals, behavior, limitations, or deployment changed.

Semantic memory may be reorganized or corrected. It must describe the accepted present, not preserve obsolete history.

## 4. Create the episodic record

Every logical change creates exactly one new file under `journals/`. A decision-bearing discussion counts as a logical memory change even when it changes no code. Never edit, rename, or delete a journal that existed before the change.

Name it `YYYYMMDD-NN-slug.md`, where `NN` is the next unused sequence for that date. Check the directory before choosing the number.

Use this shape:

```markdown
---
date: YYYY-MM-DD
sequence: NN
topic: short-topic
supersedes: []
---

# Outcome-oriented title

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context
## Decision process
## Outcome
## Trade-offs and consequences
## Verification
## Follow-ups
```

Keep only sections that carry information, but always preserve the reasoning—not just a file list. Name rejected alternatives and why they lost when a real choice occurred.

When a conclusion replaces an earlier one, list the older filename under `supersedes` and explain the correction. Leave the older file byte-for-byte untouched. If the current change already created its one new journal, verify it instead of creating a duplicate.

## 5. Reconcile the backlog

Touch `BACKLOG.md` only when the change creates, resolves, or deliberately carries an open question, deferred item, or accepted risk.

- Remove resolved items; their outcome belongs in semantic memory and the new journal.
- Add only work that survives beyond this change.
- Do not mirror current-task progress, next commands, or branch state.
- A backlog entry cannot silently postpone a semantic invariant; changing an invariant needs an explicit decision journal and semantic update.

## 6. Final integrity check

Confirm:

- gates are green;
- semantic documents state current truth;
- exactly one new immutable journal represents the change;
- backlog additions and removals are intentional;
- procedural skills changed only if a repeatable workflow changed;
- no unrelated work was modified.

Report the verification evidence and any remaining gap.

## 7. Create requested commits

Do not create a Git commit unless the user explicitly requests one. When commits are requested:

1. Review the complete workspace change boundary before staging. Preserve unrelated user work.
2. Split changes when distinct, coherent commits improve review or rollback; do not split merely to increase commit count. Each commit must leave its own scope internally consistent and pass its relevant gates.
3. Use a semantic/Conventional Commit subject in the form `type(scope): summary`. Do not introduce a commit-message linter solely to enforce the convention.
4. Follow the subject with a brief body summarizing the material changes. Include motivation or impact when useful, avoid merely repeating the subject, and require the brief even for a small commit.
5. End every coding-agent-created commit with a canonical `Co-authored-by: Name <email>` trailer for every materially contributing agent. For Codex, default to `Co-authored-by: Codex <codex@openai.com>`.
6. Inspect the resulting commits and working tree after creation. Report commit hashes, subjects, change briefs, trailers, and any remaining changes.
