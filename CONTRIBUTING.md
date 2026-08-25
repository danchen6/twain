# Contributing to Twain

Focused bug reports and pull requests are welcome. Twain is maintained as a small, dependency-free public preview, so please open an issue before investing in a substantial product, visual-design, puzzle-model, or architecture change.

## Ground rules

- Keep gameplay code browser-native and the production site deployable as unchanged static files.
- Preserve deterministic daily generation and the two-line full-board puzzle invariants documented in `AGENTS.md` and `docs/`.
- Use independently created code, boards, and assets. Do not contribute third-party trademarks, proprietary assets, or copied puzzles.
- Add no framework, package dependency, build tool, runtime server, or persistence service without first documenting the concrete need and trade-offs.
- Keep code comments and outward-facing documentation in English.

## Local checks

Serve the ES modules over HTTP:

```sh
python3 -m http.server 4173
```

Run the network-independent test suite:

```sh
npm test
```

For any user-visible change, also run the rendered browser matrix and inspect its temporary screenshots:

```sh
npm run visual-qa
```

## Pull requests

Keep each pull request focused. Explain the problem, the chosen approach, and the verification evidence. Call out any behavior, browser, device, or visual state that could not be checked rather than presenting it as verified.
