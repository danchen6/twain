import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { taiwanDateKey } from "../src/daily.js";
import {
  extractReleaseVersion,
  normalizeReleaseVersionHtml,
  validateReleaseTransition,
} from "./release-version.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const releasePaths = [
  "assets",
  "manifest.webmanifest",
  "src",
  "styles.css",
  "vendor",
];

function git(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function changedReleasePaths(baseRevision) {
  const tracked = git([
    "diff",
    "--name-only",
    baseRevision,
    "--",
    ...releasePaths,
  ]);
  const untracked = git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    ...releasePaths,
  ]);
  return [...new Set(`${tracked}\n${untracked}`.split("\n").filter(Boolean))];
}

const baseRevision = process.argv[2];
if (!baseRevision || !/^(?:HEAD|[0-9a-f]{40})$/i.test(baseRevision)) {
  throw new Error(
    "Usage: node scripts/check-release-version.mjs <40-character-base-sha|HEAD>",
  );
}

const baseHtml = git(["show", `${baseRevision}:index.html`]);
const currentHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const previousVersion = extractReleaseVersion(baseHtml, { allowMissing: true });
const currentVersion = extractReleaseVersion(currentHtml);
const changedPaths = changedReleasePaths(baseRevision);
const indexContentChanged =
  normalizeReleaseVersionHtml(baseHtml) !==
  normalizeReleaseVersionHtml(currentHtml);
const releaseContentChanged = changedPaths.length > 0 || indexContentChanged;

validateReleaseTransition({
  previousVersion,
  currentVersion,
  releaseContentChanged,
  todayDateKey: taiwanDateKey(),
});

console.log(
  `${currentVersion} is valid against ${baseRevision}${
    releaseContentChanged ? " with app content changes" : ""
  }.`,
);
