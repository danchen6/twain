import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { MESSAGES } from "../src/i18n.js";

const projectRoot = new URL("../", import.meta.url);
const SITE_URL = "https://danchen6.github.io/twain/";
const OG_IMAGE_URL = `${SITE_URL}assets/social/twain-og-v2.png`;

async function source(filename) {
  return readFile(new URL(filename, projectRoot), "utf8");
}

function tagWithAttribute(html, tagName, attribute, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...html.matchAll(
      new RegExp(
        `<${tagName}\\b[^>]*\\b${attribute}="${escapedValue}"[^>]*>`,
        "g",
      ),
    ),
  ];
  assert.equal(matches.length, 1, `${tagName}[${attribute}="${value}"]`);
  return matches[0][0];
}

function attribute(tag, name) {
  const value = tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  assert.notEqual(value, undefined, `${tag} needs ${name}`);
  return value;
}

function metaContent(html, key, property = false) {
  return attribute(
    tagWithAttribute(html, "meta", property ? "property" : "name", key),
    "content",
  );
}

async function pngMetadata(filename) {
  const bytes = await readFile(new URL(filename, projectRoot));
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", filename);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR", filename);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

test("static metadata exposes a complete rich social preview", async () => {
  const html = await source("index.html");
  const canonical = tagWithAttribute(html, "link", "rel", "canonical");

  assert.match(html, /<html lang="en" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.equal(attribute(canonical, "href"), SITE_URL);
  assert.equal(metaContent(html, "og:title", true), MESSAGES.en.metaTitle);
  assert.equal(metaContent(html, "og:type", true), "website");
  assert.equal(metaContent(html, "og:url", true), SITE_URL);
  assert.equal(metaContent(html, "og:site_name", true), "Twain");
  assert.equal(metaContent(html, "og:locale", true), "en_US");
  assert.equal(metaContent(html, "og:description", true), MESSAGES.en.metaDescription);
  assert.equal(metaContent(html, "og:image", true), OG_IMAGE_URL);
  assert.equal(metaContent(html, "og:image:secure_url", true), OG_IMAGE_URL);
  assert.equal(metaContent(html, "og:image:type", true), "image/png");
  assert.equal(metaContent(html, "og:image:width", true), "1200");
  assert.equal(metaContent(html, "og:image:height", true), "630");
  assert.match(metaContent(html, "og:image:alt", true), /nearly completed/);
  assert.match(metaContent(html, "og:image:alt", true), /Two paths.*Every cell.*Can you solve the grid\?/);
  assert.match(metaContent(html, "og:image:alt", true), /3–5 fresh challenges every day/);

  assert.equal(metaContent(html, "twitter:card"), "summary_large_image");
  assert.equal(metaContent(html, "twitter:title"), MESSAGES.en.metaTitle);
  assert.equal(metaContent(html, "twitter:description"), MESSAGES.en.metaDescription);
  assert.equal(metaContent(html, "twitter:image"), OG_IMAGE_URL);
  assert.equal(metaContent(html, "twitter:image:alt"), metaContent(html, "og:image:alt", true));

  assert.deepEqual(await pngMetadata("assets/social/twain-og-v2.png"), {
    width: 1200,
    height: 630,
    colorType: 2,
  });
  assert.deepEqual(await pngMetadata("assets/social/twain-board-preview.png"), {
    width: 604,
    height: 604,
    colorType: 2,
  });
  assert.deepEqual(await pngMetadata("assets/social/twain-og-paper-v2.png"), {
    width: 1200,
    height: 630,
    colorType: 2,
  });
});

test("Home Screen metadata provides full-bleed icons and standalone launch state", async () => {
  const [html, manifestSource, iconSource, ogSource] = await Promise.all([
    source("index.html"),
    source("manifest.webmanifest"),
    source("assets/icons/twain-app-icon.svg"),
    source("assets/social/twain-og-source.svg"),
  ]);
  const manifest = JSON.parse(manifestSource);
  const manifestLink = tagWithAttribute(html, "link", "rel", "manifest");
  const appleIcon = tagWithAttribute(html, "link", "rel", "apple-touch-icon");

  assert.equal(attribute(manifestLink, "href"), "./manifest.webmanifest");
  assert.equal(attribute(appleIcon, "href"), "./assets/icons/apple-touch-icon.png");
  assert.equal(attribute(appleIcon, "sizes"), "180x180");
  assert.equal(metaContent(html, "application-name"), "Twain");
  assert.equal(metaContent(html, "apple-mobile-web-app-capable"), "yes");
  assert.equal(metaContent(html, "apple-mobile-web-app-status-bar-style"), "default");
  assert.equal(metaContent(html, "apple-mobile-web-app-title"), "Twain");
  assert.equal(metaContent(html, "mobile-web-app-capable"), "yes");

  assert.equal(manifest.id, "./");
  assert.equal(manifest.name, MESSAGES.en.metaTitle);
  assert.equal(manifest.short_name, "Twain");
  assert.equal(manifest.description, MESSAGES.en.metaDescription);
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#f7f5f2");
  assert.equal(manifest.background_color, "#f7f5f2");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, type, purpose }) => ({
      src,
      sizes,
      type,
      purpose,
    })),
    [
      {
        src: "./assets/icons/twain-app-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "./assets/icons/twain-app-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  );

  assert.deepEqual(await pngMetadata("assets/icons/apple-touch-icon.png"), {
    width: 180,
    height: 180,
    colorType: 2,
  });
  assert.deepEqual(await pngMetadata("assets/icons/twain-app-192.png"), {
    width: 192,
    height: 192,
    colorType: 2,
  });
  assert.deepEqual(await pngMetadata("assets/icons/twain-app-512.png"), {
    width: 512,
    height: 512,
    colorType: 2,
  });

  assert.match(iconSource, /<rect width="1024" height="1024" fill="#191919"/);
  assert.match(iconSource, /d="M224 304H800"/);
  assert.match(iconSource, /d="M512 496V800"/);
  assert.match(ogSource, /href="twain-og-paper-v2\.png"/);
  assert.match(ogSource, /href="twain-board-preview\.png"/);
  assert.match(ogSource, /id="puzzle-motif"/);
  assert.match(ogSource, /<text x="72" y="246"[^>]*font-size="52"[^>]*>/);
  assert.doesNotMatch(ogSource, /<tspan[^>]*font-size=/);
  assert.match(ogSource, />Two paths\.<\/tspan>/);
  assert.match(ogSource, />Every cell\.<\/tspan>/);
  assert.match(ogSource, />Can you solve the grid\?<\/tspan>/);
  assert.match(ogSource, />\s*3–5 fresh challenges every day\.\s*<\/text>/);
  assert.doesNotMatch(ogSource, /DAILY LOGIC PUZZLE/);
  assert.doesNotMatch(ogSource, /A new Twain run every Taiwan day/);
  assert.doesNotMatch(ogSource, /twain-og-background-v1\.png/);
  assert.doesNotMatch(ogSource, /danchen6\.github\.io\/twain/);
});
