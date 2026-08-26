import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  SUPPORTED_LOCALES,
  formatLocalizedDate,
  formatLocalizedHintCount,
  formatShareHintSummary,
  isSupportedLocale,
  localeLabel,
  matchBrowserLocale,
  resolveLocale,
  translate,
} from "../src/i18n.js";

const MENU_LOCALES = [
  "zh-TW",
  "en",
  "zh-CN",
  "ja",
  "ko",
  "es",
  "pt-BR",
];
const MESSAGE_LOCALES = [
  "en",
  ...MENU_LOCALES.filter((locale) => locale !== "en"),
];

test("Twain exposes Traditional Chinese first without changing English fallback", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(LOCALE_STORAGE_KEY, "twain:locale:v1");
  assert.deepEqual(
    SUPPORTED_LOCALES.map(({ code }) => code),
    MENU_LOCALES,
  );
  assert.deepEqual(Object.keys(MESSAGES), MESSAGE_LOCALES);
  assert.equal(localeLabel("zh-TW"), "繁體中文");
  assert.equal(localeLabel("unknown"), "English");
  assert.equal(isSupportedLocale("pt-BR"), true);
  assert.equal(isSupportedLocale("pt-PT"), false);
});

test("every locale implements the complete message contract", () => {
  const englishKeys = Object.keys(MESSAGES.en).sort();
  const sampleParams = {
    col: 2,
    completed: 1,
    continuation: " Continue.",
    count: 2,
    date: "Aug 26",
    difficulty: "Easy",
    hints: "2 hints",
    language: "English",
    line: "Number line",
    number: 1,
    rows: 5,
    cols: 5,
    row: 1,
    stage: 1,
    state: "paused",
    time: "01:23",
    total: 3,
    clue: "1",
    cells: "4 cells left.",
  };

  for (const locale of MESSAGE_LOCALES) {
    assert.deepEqual(Object.keys(MESSAGES[locale]).sort(), englishKeys, locale);

    for (const key of englishKeys) {
      const rendered = translate(locale, key, sampleParams);
      assert.equal(typeof rendered, "string", `${locale}.${key}`);
      assert.notEqual(rendered.trim(), "", `${locale}.${key}`);
    }
  }

  for (const locale of MESSAGE_LOCALES.filter(
    (locale) => locale !== DEFAULT_LOCALE,
  )) {
    for (const key of [
      "metaTitle",
      "clear",
      "boardInstructions",
      "languageTitle",
      "shareResultNumbered",
    ]) {
      assert.notEqual(MESSAGES[locale][key], MESSAGES.en[key], `${locale}.${key}`);
    }
  }
});

test("browser locale matching handles Chinese scripts and regional variants", () => {
  const cases = [
    [["en-GB"], "en"],
    [["zh-TW"], "zh-TW"],
    [["zh-Hant-HK"], "zh-TW"],
    [["zh-HK"], "zh-TW"],
    [["zh-MO"], "zh-TW"],
    [["zh-CN"], "zh-CN"],
    [["zh-Hans-SG"], "zh-CN"],
    [["zh"], "zh-CN"],
    [["ja-JP"], "ja"],
    [["ko-KR"], "ko"],
    [["es-MX"], "es"],
    [["pt-BR"], "pt-BR"],
    [["pt-PT"], "pt-BR"],
    [["invalid_locale", "es-AR"], "es"],
    [["fr-FR"], "en"],
    [[], "en"],
  ];

  for (const [requested, expected] of cases) {
    assert.equal(matchBrowserLocale(requested), expected, requested.join(","));
  }
});

test("a valid explicit override wins and invalid overrides fall back to auto", () => {
  assert.deepEqual(
    resolveLocale({ override: "ja", browserLocales: ["zh-TW"] }),
    { locale: "ja", source: "override" },
  );
  assert.deepEqual(
    resolveLocale({ override: "fr", browserLocales: ["zh-Hant"] }),
    { locale: "zh-TW", source: "auto" },
  );
  assert.deepEqual(resolveLocale(), { locale: "en", source: "auto" });
});

test("localized dates use each locale without changing the calendar day", () => {
  assert.deepEqual(
    Object.fromEntries(
      MESSAGE_LOCALES.map((locale) => [
        locale,
        formatLocalizedDate("2026-08-26", locale),
      ]),
    ),
    {
      en: "Aug 26",
      "zh-TW": "8月26日",
      "zh-CN": "8月26日",
      ja: "8月26日",
      ko: "8월 26일",
      es: "26 ago",
      "pt-BR": "26 de ago.",
    },
  );
  assert.throws(() => formatLocalizedDate("2026-02-30", "en"), RangeError);
  assert.throws(() => formatLocalizedDate("Aug 26", "en"), RangeError);
});

test("hint counts and share summaries localize zero and plural forms", () => {
  assert.equal(formatLocalizedHintCount("en", 1), "1 hint");
  assert.equal(formatLocalizedHintCount("es", 2), "2 pistas");
  assert.equal(formatLocalizedHintCount("zh-TW", 2), "2 次提示");
  assert.equal(formatShareHintSummary("en", 0), "no hints");
  assert.equal(formatShareHintSummary("zh-TW", 2), "使用了 2 次提示");
  assert.equal(formatShareHintSummary("ja", 0), "ヒントなし");
  assert.equal(formatShareHintSummary("pt-BR", 0), "nenhuma dica");
  assert.throws(() => formatLocalizedHintCount("en", -1), RangeError);
  assert.throws(() => formatShareHintSummary("en", 1.5), RangeError);
});
