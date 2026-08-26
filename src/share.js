import {
  DEFAULT_LOCALE,
  formatLocalizedHintCount,
  formatShareHintSummary,
  translate,
} from "./i18n.js";

export function formatHintCount(hints, locale = DEFAULT_LOCALE) {
  return formatLocalizedHintCount(locale, hints);
}

export function formatDailyResultShareText({
  elapsed,
  hints,
  twainNumber = null,
  locale = DEFAULT_LOCALE,
}) {
  const hintSummary = formatShareHintSummary(locale, hints);
  const key =
    twainNumber === null ? "shareResultUnnumbered" : "shareResultNumbered";

  return translate(locale, key, {
    number: twainNumber,
    time: elapsed,
    hints: hintSummary,
  });
}
