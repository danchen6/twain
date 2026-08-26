import { readFile, writeFile } from "node:fs/promises";

import {
  extractReleaseVersion,
  nextReleaseVersion,
  replaceReleaseVersion,
} from "./release-version.mjs";

const indexUrl = new URL("../index.html", import.meta.url);
const html = await readFile(indexUrl, "utf8");
const currentVersion = extractReleaseVersion(html);
const nextVersion = nextReleaseVersion(currentVersion);

await writeFile(indexUrl, replaceReleaseVersion(html, nextVersion));
console.log(`${currentVersion} -> ${nextVersion}`);
