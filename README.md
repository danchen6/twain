# Twain

_Never the twain shall meet._

An original daily two-line path puzzle.

> **Public Preview** — [Play Twain on GitHub Pages](https://danchen6.github.io/twain/). The core game is playable, while broader human difficulty, physical-device, accessibility, and low-end performance validation remain in progress.

Guide the round Number line through `1, 2, 3…` and the square Letter line through `A, B, C…`. The lines must never share a cell, and together they must fill the board. There is no prescribed quota for either line: any valid full-board partition wins.

Each Taiwan calendar date deterministically samples and shuffles three to five unique levels from Easy, Medium, Hard, Extra, and Ultra. The launch run on August 26, 2026 is Twain #1, with the public number increasing once per Taiwan calendar day. Everyone running the same version sees the same schedule and boards for that date. Clear the selected levels in order against one shared timer; progress, current paths, and elapsed time resume from local storage in the same browser. Header Share opens the canonical date-driven URL as a locally generated QR code and copyable link; the finished result adds the Twain number, elapsed time, and Hint count.

Every board is generated locally from complete witness lines, so it is always solvable. A bounded solver ranks deterministic candidate pools by search effort and solution density rather than assuming that fewer clues or more walls are automatically harder. The stage seed also selects one of several curated, high-contrast route palettes.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. No build or install step is required.

## Test

```sh
npm test
```

## Visual QA

```sh
npm run visual-qa
```

The harness uses a locally installed Edge, Chrome, or Chromium browser, exercises the complete daily run and responsive interaction matrix, and writes screenshots to a temporary directory for inspection. Set `TWAIN_BROWSER_PATH` when the browser cannot be detected automatically.

## Deploy

Pull requests into `master` and pushes to `master` run the Node test suite. A successful push, or a manual workflow run from `master`, then deploys the unchanged static site to GitHub Pages.

Enable **GitHub Actions** as the Pages source in the repository settings. No custom domain or build step is required.

## Contributing

Focused bug reports and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a substantial product, design, or architecture change.

## License

Twain is available under the [MIT License](LICENSE). Copyright (c) 2026 Dan Chen. Vendored components retain their own licenses in the [third-party notices](THIRD_PARTY_NOTICES.md).
