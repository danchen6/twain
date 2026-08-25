---
date: 2026-08-25
sequence: 18
topic: public-preview-pages
supersedes:
  - "20260825-03-square-board-visuals.md"
  - "20260825-04-compact-game-layout.md"
  - "20260825-05-number-letter-lines.md"
  - "20260825-07-solver-calibrated-extra.md"
  - "20260825-13-daily-twain-run.md"
  - "20260825-17-daily-identity-ballistic-celebration.md"
---

# Publish Twain as a gated GitHub Pages public preview

> Immutable episodic record. Do not edit; supersede with a newer journal.

## Context

The repository was already public and had a no-build GitHub Pages workflow, but its deployment job accepted pushes from both `main` and `master`, did not run on pull requests, and held Pages write permissions at workflow scope. Dan chose to publish the game as a Public Preview from the existing `danchen6/twain` repository, without a custom domain. Focused external pull requests may be accepted, but they are not required for the project to progress.

## Decision process

- Keep the source and site in one repository and use GitHub Actions Project Pages at `https://danchen6.github.io/twain/`. The relative asset contract already supports the `/twain/` path.
- Reject direct branch publishing because it would discard the existing test-before-deploy gate.
- Reject a `danchen6.github.io` or other dedicated deployment repository because a second source of truth, cross-repository credentials, and synchronization drift add no value to this build-free site.
- Defer a custom domain because there is no current branding or URL requirement that justifies DNS ownership and another browser origin.
- Treat `master` as the sole production ref instead of allowing either conventional branch name to deploy. Pull requests into that ref run a read-only `Test` job; `Deploy Pages` requires the successful job and owns the narrowly scoped Pages and OIDC write permissions.
- State Public Preview maturity in repository documentation rather than adding a badge or banner to the game chrome. The preview accepts known validation gaps without weakening puzzle correctness or the normal release gate.
- Add concise contribution guidance instead of a larger community-governance surface. Issues and focused pull requests are welcome; substantial changes should be discussed first.

This decision supersedes only the older entries' release-timing conclusion that the carried identity, human-calibration, physical-device, responsive, clock-trust, and accessibility risks must block any public availability. Their product, generator, and interface outcomes remain current. Those risks now block graduation from Public Preview to a stable release rather than the preview itself.

## Outcome

- `.github/workflows/pages.yml` tests pull requests into and pushes to `master`, and deploys only a tested non-pull-request `master` run.
- `README.md` links the intended Pages URL, labels the release Public Preview, documents the deployment behavior, and points contributors to `CONTRIBUTING.md`.
- `CONTRIBUTING.md` records the static-runtime, determinism, originality, dependency, test, and rendered-visual expectations for external changes.
- Product, architecture, generation, and quality memory describe the preview maturity and deployment gate. Stable-release validation items remain explicit in `BACKLOG.md` under the preview-graduation milestone.

## Trade-offs and consequences

GitHub Pages still provides one production environment rather than per-pull-request previews. Node tests run automatically, while rendered browser QA remains a maintainer checkpoint until browser provisioning is added to CI. Uploading the unchanged repository keeps deployment simple and deterministic; the repository is public, so a separate curated build artifact would add maintenance without creating a security boundary.

The repository-level workflow cannot set its own Pages source, homepage metadata, or default-branch ruleset. Those GitHub settings must be applied after the reviewed files are committed and pushed; they are rollout state, not backlog work.

## Verification

- `node --test tests/static.test.js`: 8/8 tests passed, including the single-production-branch workflow contract and public-preview/license/contribution metadata.
- `npm test`: 50/50 tests passed, including generator, solver, daily-state, interaction, static deployment, and the new workflow contract.
- `npm run visual-qa -- --output /private/tmp/twain-preview-qa.M15MGw`: the complete Edge matrix passed all interaction, responsive, nested-path, localStorage, and browser-console assertions at `http://127.0.0.1:51234/twain/`.
- Inspected fresh-state captures at 1440×1000, 768×1024, 390×844, and 320×800 against `docs/design.md`. The logo, CSS, ES modules, board, toolbar, controls, and project-path assets loaded without overflow, clipping, loading states, or hierarchy regressions. No defect or recapture was required.
- Parsed `.github/workflows/pages.yml` successfully as YAML and ran `git diff --check` without errors.
- The GitHub-rendered README and live Pages URL cannot exist until the reviewed work is committed, pushed, and Pages is enabled; source-level copy and link checks pass, and this rollout state is reported rather than presented as deployed.

## Follow-ups

After an explicitly requested commit and push, set Pages Source to **GitHub Actions**, set the repository homepage to `https://danchen6.github.io/twain/`, and protect `master` with the `Test` status check plus force-push and deletion prevention. The stable-release validation boundary remains in `BACKLOG.md`.
