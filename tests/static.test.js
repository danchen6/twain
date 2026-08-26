import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function source(filename) {
  return readFile(new URL(filename, projectRoot), "utf8");
}

test("static entry point references relative, present assets", async () => {
  const html = await source("index.html");
  const expectedAssets = [
    "./styles.css",
    "./src/main.js",
    "./assets/twain-mark.svg",
    "./manifest.webmanifest",
    "./assets/icons/apple-touch-icon.png",
  ];

  for (const asset of expectedAssets) {
    assert.match(html, new RegExp(asset.replaceAll(".", "\\.")));
    await access(new URL(asset, projectRoot));
  }

  assert.doesNotMatch(html, /(?:src|href)=["']\/(?!\/)/);
});

test("Pages workflow tests pull requests and gates deployment on master", async () => {
  const workflow = await source(".github/workflows/pages.yml");

  assert.match(
    workflow,
    /pull_request:\s*\n\s*branches:\s*\n\s*- master/,
  );
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- master/);
  assert.doesNotMatch(workflow, /^\s*- main$/m);
  assert.match(workflow, /test:\s*\n\s*name: Test/);
  assert.match(workflow, /deploy:[\s\S]*needs: test/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/master'/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
  assert.match(
    workflow,
    /deploy:[\s\S]*permissions:[\s\S]*pages: write[\s\S]*id-token: write/,
  );
});

test("runtime source has no bare package imports", async () => {
  const filenames = [
    "daily.js",
    "daily-state.js",
    "generator.js",
    "solver.js",
    "game.js",
    "palette.js",
    "qr.js",
    "i18n.js",
    "share.js",
    "analytics.js",
    "streak.js",
    "telemetry.js",
    "main.js",
  ];

  for (const filename of filenames) {
    assert.doesNotMatch(await source(`src/${filename}`), /from\s+["'](?!\.)/);
  }
});

test("optional analytics remains consent-gated and absent from static markup", async () => {
  const [html, analyticsSource, main] = await Promise.all([
    source("index.html"),
    source("src/analytics.js"),
    source("src/main.js"),
  ]);

  assert.match(html, /id="privacyBanner"[\s\S]*role="region"/);
  assert.match(html, /id="bannerDeclineButton"/);
  assert.match(html, /id="bannerAcceptButton"/);
  assert.match(html, /id="privacyDialog"/);
  assert.match(html, /id="privacyPreferencesButton"/);
  assert.doesNotMatch(html, /googletagmanager|google-analytics/);
  assert.match(analyticsSource, /enabled: false/);
  assert.match(analyticsSource, /measurementId: ""/);
  assert.match(
    analyticsSource,
    /readAnalyticsConsent\(storage\)\?\.state !== "granted"/,
  );
  assert.match(main, /canonicalizeLocation\(\);\s*analytics\.initialize\(\);/);
});

test("public project identity presents Twain as one daily run", async () => {
  const [
    html,
    logo,
    readme,
    packageSource,
    license,
    contributing,
    thirdPartyNotices,
    qrSource,
    qrLicense,
  ] = await Promise.all([
    source("index.html"),
    source("assets/twain-mark.svg"),
    source("README.md"),
    source("package.json"),
    source("LICENSE"),
    source("CONTRIBUTING.md"),
    source("THIRD_PARTY_NOTICES.md"),
    source("vendor/qrcode-generator.mjs"),
    source("vendor/qrcode-generator.LICENSE"),
  ]);
  const packageMetadata = JSON.parse(packageSource);

  assert.match(html, /<title>Twain — Never the twain shall meet<\/title>/);
  assert.match(html, /<span>Twain<\/span>/);
  assert.match(html, /class="brand-mark"[\s\S]*src="\.\/assets\/twain-mark\.svg"/);
  assert.match(html, /rel="icon" href="\.\/assets\/twain-mark\.svg"/);
  assert.equal((logo.match(/<path\b/g) ?? []).length, 2);
  assert.match(logo, /stroke="#20B7D4"/);
  assert.match(logo, /stroke="#F97714"/);
  assert.match(logo, /d="M14 19H50"/);
  assert.match(logo, /d="M32 31V50"/);
  assert.match(html, /class="header-date" id="dailyDate"/);
  assert.doesNotMatch(html, /id="pageTitle"|class="header-subtitle"/);
  assert.doesNotMatch(html, /GMT\+8/);
  assert.match(html, /id="helpButton"/);
  assert.match(html, /id="shareButton"/);
  assert.match(html, /id="languageButton"/);
  assert.match(
    html,
    /id="helpButton"[\s\S]*id="shareButton"[\s\S]*id="languageButton"[\s\S]*<\/div>\s*<div[\s\S]*id="languageMenu"/,
  );
  assert.match(html, /id="languageMenu"[\s\S]*role="menu"/);
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /<dialog class="how-to-dialog" id="howToDialog"/);
  assert.doesNotMatch(html, /copyLinkTop|>\s*Share today\s*</);
  assert.match(readme, /^# Twain$/m);
  assert.match(readme, /Never the twain shall meet/);
  assert.match(readme, /\*\*Public Preview\*\*/);
  assert.match(readme, /https:\/\/danchen6\.github\.io\/twain\//);
  assert.match(readme, /\[CONTRIBUTING\.md\]\(CONTRIBUTING\.md\)/);
  assert.match(readme, /\[third-party notices\]\(THIRD_PARTY_NOTICES\.md\)/i);
  assert.equal(packageMetadata.name, "twain");
  assert.match(packageMetadata.description, /daily two-line path puzzle/i);
  assert.equal(packageMetadata.license, "MIT");
  assert.match(license, /^MIT License$/m);
  assert.match(license, /Copyright \(c\) 2026 Dan Chen/);
  assert.match(contributing, /^# Contributing to Twain$/m);
  assert.match(thirdPartyNotices, /qrcode-generator.*2\.0\.4/s);
  assert.match(thirdPartyNotices, /vendor\/qrcode-generator\.LICENSE/);
  assert.equal(
    createHash("sha256").update(qrSource).digest("hex"),
    "ea91d7118a5395289170da848b7c6758b996163bfbccf312591ab65a4911b7c0",
  );
  assert.match(qrLicense, /^MIT License$/m);
  assert.equal(
    packageMetadata.scripts["visual-qa"],
    "node .agents/skills/visual-qa/scripts/run.mjs",
  );
});

test("language selection auto-detects and persists an explicit override", async () => {
  const [html, main, i18n] = await Promise.all([
    source("index.html"),
    source("src/main.js"),
    source("src/i18n.js"),
  ]);

  assert.match(i18n, /LOCALE_STORAGE_KEY = "twain:locale:v1"/);
  assert.match(i18n, /new Intl\.Locale\(requested\)/);
  assert.match(i18n, /script === "Hant"/);
  assert.match(main, /navigator\.languages/);
  assert.match(main, /window\.localStorage\.setItem\(LOCALE_STORAGE_KEY/);
  assert.match(main, /window\.localStorage\.removeItem\(LOCALE_STORAGE_KEY/);
  assert.match(main, /document\.documentElement\.lang = activeLocale/);
  assert.match(main, /role", "menuitemradio"/);
  assert.match(main, /formatDailyResultShareText\(\{[\s\S]*locale: activeLocale/);
  assert.match(html, /class="language-menu-options" id="languageOptions"/);
});

test("daily-only chrome exposes timer, progress, and Clear in order", async () => {
  const [html, styles] = await Promise.all([
    source("index.html"),
    source("styles.css"),
  ]);

  assert.match(
    html,
    /id="dailyTimer"[\s\S]*id="dailyProgress"[\s\S]*id="clearButton"/,
  );
  assert.match(
    html,
    /id="dailyTimer"[\s\S]*?<svg[^>]*>[\s\S]*?id="timerValue"/,
  );
  assert.equal((html.match(/data-daily-step=/g) ?? []).length, 0);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /id="dailyProgressTrack"/);
  assert.doesNotMatch(html, /daily-progress-copy|dailyProgressValue/);
  assert.doesNotMatch(styles, /\.daily-progress-copy/);
  assert.match(html, /id="continueButton"/);
  assert.match(
    html,
    /class="board-stage"[\s\S]*id="board"[\s\S]*id="completionOverlay"[\s\S]*class="game-controls"/,
  );
  assert.doesNotMatch(html, /daily-progress-label|id="puzzleMeta"/);
  assert.doesNotMatch(html, /data-mode=|data-difficulty=|id="newBoardButton"/);
  assert.doesNotMatch(html, />\s*New\s*</);
  assert.doesNotMatch(html, /id="replayButton"|id="newPuzzleButton"/);
  assert.doesNotMatch(styles, /\.mode-picker|\.difficulty-picker|\.segmented-control/);
  assert.match(
    styles,
    /\.game-toolbar\s*{[^}]*grid-template-columns:\s*auto minmax\(132px, 1fr\) auto;/s,
  );
  assert.match(
    styles,
    /\.daily-progress-track\s*{[^}]*repeat\(var\(--daily-stage-count, 3\), 1fr\)/s,
  );
  assert.match(styles, /\.board-completion\s*{[^}]*position:\s*absolute;/s);
  assert.match(styles, /animation:\s*celebration-pop/);
  assert.doesNotMatch(styles, /animation-duration:\s*(?:780|1560|2280)ms/);
  assert.match(
    styles,
    /--cheer-25-x:[\s\S]*--cheer-100-y:[\s\S]*animation:\s*celebration-pop 500ms linear/,
  );
  assert.match(styles, /rotate\(var\(--rotation-25\)\)/);
  assert.match(styles, /rotate\(var\(--rotation-100\)\)/);
  assert.doesNotMatch(styles, /\.celebration-burst span:nth-child/);
  assert.match(
    html,
    /<div class="celebration-burst" aria-hidden="true"><\/div>/,
  );
  assert.match(html, /id="completionTitle">Nicely done!<\/h2>/);
  assert.match(html, /id="completionStats">0 hints<\/p>/);
  assert.match(html, /id="completionCountdown" hidden/);
  assert.match(html, /id="shareResultButton"[\s\S]*?hidden/);
  assert.match(html, />\s*Next level\s*<\/button>/);
  assert.doesNotMatch(html, /completionKicker|LEVEL COMPLETE|DAILY RUN COMPLETE/);
  assert.doesNotMatch(html, /Daily time|The twain never met\./);
});

test("board geometry and clue typography retain the Twain visual contract", async () => {
  const [html, styles, main] = await Promise.all([
    source("index.html"),
    source("styles.css"),
    source("src/main.js"),
  ]);

  assert.doesNotMatch(html, /class="eyebrow"|ENDLESS NUMBER PATHS/);
  assert.doesNotMatch(styles, /\.board:focus-visible/);
  assert.match(styles, /\.board:focus\s*{\s*outline:\s*none;/);
  assert.match(
    styles,
    /\.clue-slot\.line-b \.clue-disc\s*{\s*border-radius:\s*0;\s*background:\s*#292018;/,
  );
  assert.match(
    styles,
    /\.clue-slot\.line-a \.clue-disc\s*{\s*background:\s*#292018;/,
  );
  assert.match(
    styles,
    /\.board \.clue-disc\s*{[^}]*font-size:\s*clamp\(1\.05rem,\s*4\.3vw,\s*1\.6rem\);[^}]*font-weight:\s*600;/s,
  );
  assert.match(
    styles,
    /\.clue-disc\.is-wide\s*{[^}]*letter-spacing:\s*-0\.075em;/s,
  );
  assert.match(
    styles,
    /\.clue-slot\.line-a \.clue-disc\.is-wide \.clue-value\s*{\s*transform:\s*translate\(-0\.06em,\s*0\.04em\);/,
  );
  assert.match(
    styles,
    /\.board\[data-active-line="a"\]:not\(\.is-complete\)[^}]*opacity:\s*0\.45;/s,
  );
  assert.match(
    styles,
    /\.board-stage\s*{[^}]*width:\s*min\(100%,\s*calc\(100svh - 180px\)\);/s,
  );
  assert.match(
    styles,
    /--theme-accent:\s*color-mix\(in srgb, var\(--accent\) 62%, #dedad4\);/,
  );
  const headerDateRule = styles.match(/\.header-date\s*{([^}]*)}/)?.[1] ?? "";
  assert.match(headerDateRule, /color:\s*var\(--ink\);/);
  assert.match(headerDateRule, /font-size:\s*1rem;/);
  assert.match(headerDateRule, /font-variant-numeric:\s*tabular-nums;/);
  assert.match(headerDateRule, /font-weight:\s*760;/);
  assert.doesNotMatch(headerDateRule, /letter-spacing/);
  assert.match(
    styles,
    /\.daily-progress-track span\.is-current\s*{[^}]*background:\s*var\(--theme-accent\);/s,
  );
  assert.doesNotMatch(
    styles,
    /\.brand\s*>\s*span:last-child\s*{[^}]*display:\s*none;/s,
  );
  assert.doesNotMatch(styles, /\.board\.is-invalid|board-nudge/);
  assert.doesNotMatch(main, /flashInvalidBoard|is-invalid/);
  assert.match(
    styles,
    /#helpButton\s*{[^}]*color:\s*#fff;[^}]*background:\s*var\(--ink\);/s,
  );
  assert.doesNotMatch(styles, /\.timer svg\s*{[^}]*display:\s*none;/s);
  assert.doesNotMatch(styles, /\.completion-kicker/);
  assert.match(main, /data-glyph-count="\$\{glyphCount\}"/);
  assert.match(main, /glyphCount > 1 \? " is-wide" : ""/);
  assert.doesNotMatch(main, /<rect[^>]+\srx=/);
});

test("daily runtime owns deterministic progression, persistence, and rollover", async () => {
  const main = await source("src/main.js");
  const openHeaderShareSource =
    main.match(
      /function openHeaderShare\(\)[\s\S]*?(?=function closeHeaderShare)/,
    )?.[0] ?? "";

  assert.match(main, /dailyStageSeed\(dateKey, difficulty\)/);
  assert.match(main, /dailyDifficultyAt\(dateKey, stageIndex\)/);
  assert.match(main, /dailyTwainNumber\(session\.dateKey\)/);
  assert.match(main, /restoreDailyPlay\(stored, dateKey, puzzle\)/);
  assert.match(main, /createDailyStorageRecord\(session, currentElapsed\(\)\)/);
  assert.match(main, /window\.localStorage\.setItem\(DAILY_STORAGE_KEY/);
  assert.match(main, /document\.addEventListener\("visibilitychange"/);
  assert.match(main, /taiwanDateKey\(\) !== session\.dateKey/);
  assert.match(main, /continueButton\.addEventListener\("click", continueDailyRun\)/);
  assert.match(main, /shareButton\.addEventListener\("click", openHeaderShare\)/);
  assert.match(openHeaderShareSource, /headerShareDialog\.showModal\(\)/);
  assert.match(openHeaderShareSource, /renderHeaderShareQr\(url\)/);
  assert.doesNotMatch(openHeaderShareSource, /navigator\.(?:canShare|share)/);
  assert.match(main, /!window\.isSecureContext \|\| typeof navigator\.share/);
  assert.match(main, /typeof navigator\.share !== "function"/);
  assert.match(main, /navigator\.canShare\(shareData\)/);
  assert.match(main, /shareResult = navigator\.share\(shareData\)/);
  assert.match(main, /!shareResult \|\| typeof shareResult\.then !== "function"/);
  assert.doesNotMatch(main, /await navigator\.share/);
  assert.match(main, /navigator\.clipboard\.writeText\(text\)/);
  assert.match(main, /function legacyCopyText\(text\)/);
  assert.match(main, /document\.execCommand\("copy"\)/);
  assert.match(main, /openShareFallback\(fallbackText, copiedMessage\)/);
  assert.match(main, /millisecondsUntilNextTaiwanDay\(\)/);
  assert.match(main, /completionTitle\.textContent = t\("completionWell"\)/);
  assert.match(main, /completionOverlay\.classList\.toggle\([\s\S]*"is-daily-complete"/);
  assert.match(main, /const DAILY_CONFETTI_WAVES = 3;/);
  assert.match(main, /const DAILY_CONFETTI_PER_WAVE = 16;/);
  assert.match(main, /const CONFETTI_WAVE_INTERVAL = 560;/);
  assert.match(main, /createSeededRandom\(`twain-confetti:v3:\$\{signature\}`\)/);
  assert.match(main, /function perimeterOrigin\(sector, random\)/);
  assert.match(main, /const y = launchY \* progress \+ gravity \* progress \* progress;/);
  assert.match(main, /--cheer-\$\{label\}-x/);
  assert.match(main, /piece\.style\.animationIterationCount = "1"/);
  assert.match(main, /renderCelebration\(session\.dailyComplete\)/);
  assert.match(main, /t\("countdown", \{[\s\S]*formatCountdown/);
  assert.match(main, /shareResultButton\.addEventListener\("click", shareDailyResult\)/);
  assert.match(main, /formatDailyResultShareText\(\{/);
  assert.match(main, /hints:\s*session\.hints/);
  assert.match(main, /helpButton\.addEventListener\("click", openHowTo\)/);
  assert.match(main, /howToDialog\.showModal\(\)/);
  assert.match(main, /clearButton\.addEventListener\("click", clearCurrentPuzzle\)/);
  assert.match(main, /dailyProgressTrack\.replaceChildren\(\.\.\.steps\)/);
  assert.match(main, /session\.schedule\.length/);
  assert.doesNotMatch(main, /URLSearchParams|createSeed\(|normalizeDifficulty/);
});

test("compact chrome keeps accessible status and mobile gesture policy", async () => {
  const [html, styles] = await Promise.all([
    source("index.html"),
    source("styles.css"),
  ]);
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/i)?.[1];

  assert.match(
    html,
    /<header class="site-header">[\s\S]*?<span>Twain<\/span>[\s\S]*?<p class="header-date" id="dailyDate"[\s\S]*?id="helpButton"[\s\S]*?id="shareButton"[\s\S]*?<\/header>/,
  );
  assert.match(html, /aria-haspopup="dialog"[\s\S]*aria-controls="howToDialog"/);
  assert.match(
    html,
    /id="shareButton"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-controls="headerShareDialog"/,
  );
  assert.match(html, /id="closeHowToButton"/);
  assert.match(
    html,
    /id="headerShareDialog"[\s\S]*id="headerShareQr"[\s\S]*id="headerShareUrl"[\s\S]*id="copyHeaderShareButton"/,
  );
  assert.match(html, /id="shareFallbackDialog"[\s\S]*id="shareFallbackText"/);
  assert.match(html, /id="copyShareFallbackButton"/);
  assert.match(html, /id="shareFeedback"[\s\S]*role="status"/);
  assert.doesNotMatch(html, /<details class="how-to"/);
  assert.match(
    html,
    /class="visually-hidden"[\s\S]*id="liveAnnouncer"[\s\S]*aria-live="polite"/,
  );
  assert.doesNotMatch(
    html,
    /class="status-panel"|id="statusMessage"|id="puzzleMeta"|<footer\b/,
  );
  assert.ok(viewport);
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.match(styles, /html\s*{[^}]*touch-action:\s*manipulation;/s);
  assert.match(styles, /html\s*{[^}]*-webkit-touch-callout:\s*none;/s);
  assert.match(styles, /html\s*{[^}]*user-select:\s*none;/s);
  assert.match(styles, /\.board\s*{[^}]*touch-action:\s*none;/s);
  assert.match(
    styles,
    /\.share-fallback-text\s*{[^}]*-webkit-touch-callout:\s*default;[^}]*user-select:\s*text;/s,
  );
  assert.match(
    styles,
    /\.header-share-url\s*{[^}]*-webkit-touch-callout:\s*default;[^}]*user-select:\s*text;/s,
  );
  assert.match(styles, /\.share-feedback\s*{[^}]*position:\s*fixed;/s);
});
