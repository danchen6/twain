# Analytics and Privacy

## Operating contract

Twain's optional Google Analytics 4 integration is production-configured for web stream `G-BBJX7TJD6W`, with debug mode off. `src/analytics.js` loads the Google tag only when all three gates are true:

1. `ANALYTICS_CONFIG.enabled` is `true`;
2. `ANALYTICS_CONFIG.measurementId` is a valid `G-…` or `GT-…` identifier; and
3. this browser has an explicit `granted` consent record.

Until all three gates pass, Twain creates no Google tag, `dataLayer`, or analytics request. A first visit shows the localized bottom privacy banner with direct **Decline** and **Allow analytics** actions. **Privacy details** explains the data boundary. The same choices remain available from Help → **Privacy choices**; revocation updates consent and reloads into a tag-free page.

`twain:analytics-consent:v2` is a browser-local JSON record:

```json
{
  "version": 2,
  "state": "granted",
  "updatedAt": "2026-08-26T04:05:06.000Z"
}
```

The state is `granted` or `denied`; malformed records are treated as no choice. A grant is written to localStorage and persists across page sessions. A denial removes any grant and is written only to sessionStorage, so reloads in the current page session remain declined but a later page session asks again. A session denial wins if both stores somehow contain a valid record. If the required store cannot save the choice, it is not treated as permission, analytics stays disabled, and the banner remains.

This is an on-device preference record, not a centrally auditable consent ledger: clearing the relevant browser state removes it, and choices do not synchronize across devices. A material change to the analytics vendor, purpose, or disclosed data boundary requires a new consent-storage version and a fresh choice. Account-side Enhanced Measurement expanded the earlier outcome-plus-standard-context disclosure to automatic page and content interactions, so v2 deliberately ignores and removes all v1 grants and denials rather than treating them as permission for the new boundary.

The Google tag uses basic consent behavior. No tag is loaded before permission or after a declined page load. When permission is granted, analytics storage is granted while ad storage, ad user data, ad personalization, Google signals, and ad-personalization signals remain denied or disabled. GA may then set first-party `_ga` cookies for pseudonymous client/session identifiers. The canonical URL is stripped of query parameters and fragments before the tag can send its initial page view.

Daily progress, streak, and locale localStorage are first-party functional state. The consent preference uses the split storage described above. Declining optional analytics does not disable the gameplay state.

## Streak contract

`twain:streak:v1` tracks `currentStreak`, `longestStreak`, `totalCompletedDays`, and `lastCompletedDate`. Only completion of every selected stage for a Taiwan calendar date records a day; opening a puzzle or completing an intermediate stage does not. Repeating or restoring the same completed day is idempotent, the next Taiwan date increments the streak, and a later gap resets only the current streak.

Streak is intentionally browser-local and has no visible UI yet. Clearing site data, changing browsers/devices, or using a private session starts a separate record. The device-clock caveat that applies to daily selection also applies to streak dates.

## Event model

Twain's manually dispatched gameplay events send bounded outcomes, not path-level behavior. Strings are capped at 100 characters, event and parameter names follow GA limits, non-scalar values are rejected, and each event is capped at 25 parameters.

| Event | When | Material parameters |
| --- | --- | --- |
| `daily_run_start` | The first valid move or Hint starts today's first stage | `daily_number`, `daily_run_version`, `level_name`, `stage_count`, `streak_days`, `display_mode`, `ui_locale` |
| `level_start` | The first valid move or Hint starts each fresh stage | common context plus `stage_number`, `level_name`, `board_cells` |
| `hint_used` | A Hint changes the board | common/stage context plus cumulative `hint_number`, pre-Hint `occupied_cells`, `corrected`, `daily_elapsed_seconds` |
| `level_end` | A stage is solved | common/stage context plus `success`, cumulative daily time/Hints/mistakes and stage deltas when known |
| `daily_run_complete` | The final selected stage is solved | `daily_elapsed_seconds`, cumulative Hints/mistakes, stage count, current/longest streak, and total completed days |

Common context is the launch-relative numeric daily number, daily-run format version, selected UI locale, and browser versus standalone display mode. Difficulty is sent as GA's recommended `level_name`; `level_start` and `level_end` use GA's recommended game-event names.

### Enhanced Measurement

Enhanced Measurement is enabled on the GA web stream. It is controlled in the Google Analytics account rather than by additional application code; once the consented tag initializes, the enabled options can automatically emit:

| Measurement | GA event | Automatic context |
| --- | --- | --- |
| Page views | `page_view` | page load or configured browser-history changes, with page location and referrer |
| Scrolls | `scroll` | the first time 90% vertical depth becomes visible, with percent scrolled |
| Outbound clicks | `click` | destination URL/domain plus link ID/classes and outbound flag |
| Site search | `view_search_results` | recognized search-query parameter and search term |
| Video engagement | `video_start`, `video_progress`, `video_complete` | supported embedded YouTube video title, URL, provider, progress, duration, and visibility |
| File downloads | `file_download` | linked file name/extension and link metadata |
| Form interactions | `form_start`, `form_submit` | form ID/name/destination and, on submit, button text |

The current Twain surface has no site search, video, download, form, or outbound-link feature, so those categories should not fire today; page view and scroll are the applicable Enhanced Measurement surfaces. They are still disclosed because account-side collection would begin automatically if a matching surface were later added. Any such addition must review URLs, search terms, form attributes, and submit labels for personally identifiable information before release.

Legacy `twain:daily:v2` play records created before stage baselines can still restore. Their cumulative totals remain valid, but unknown per-stage time/Hint/mistake deltas are omitted rather than guessed. New records persist those three baselines without changing the daily-run version or invalidating in-progress play.

Twain's custom gameplay event builders deliberately do not send puzzle paths, individual moves, puzzle seeds, clue values, free-text input, names, email addresses, account IDs, or a custom user ID. Enhanced Measurement is a separate automatic path and may include the page, link, search, video, download, and form metadata listed above when applicable. GA also collects consented session statistics, browser/device and approximate-geography context, and a cookie-based pseudonymous client identifier; the notice states that broader boundary.

## GA4 rollout

The committed production configuration targets `G-BBJX7TJD6W`, sets `enabled: true`, and keeps `debug: false`. Repository-side browser verification intercepts the remote tag so QA cannot pollute production analytics; it proves that undecided and declined sessions are request-free, a grant initializes only the configured tag, and active revocation reloads into a tag-free page.

The remaining account-side and end-to-end rollout work is:

1. Complete the applicable Google account, data-retention, notice/legal-basis, and persistent-grant expiry/re-prompt review for the intended jurisdictions. Review every enabled Enhanced Measurement option and its URL/form/search metadata for PII risk.
2. In a non-production verification run, temporarily enable `debug`, grant analytics, and confirm the applicable Enhanced Measurement events plus all five gameplay events in DebugView. Restore `debug: false` before deployment.
3. Mark `daily_run_complete` as a key event.
4. Register only parameters needed for reporting. Recommended event-scoped dimensions are `daily_run_version`, `display_mode`, `ui_locale`, `level_name`, `stage_number`, `stage_count`, `board_cells`, and `corrected`. Recommended custom metrics are elapsed-time fields, Hint/mistake fields, `occupied_cells`, and streak/completed-day fields.
5. Do not register `daily_number` as a custom dimension or metric: the value grows indefinitely, and aggregating puzzle numbers is not meaningful. Use GA's date dimension for routine trends and the raw numeric parameter in an export for puzzle-specific investigation.

## Recommended analysis

1. **Daily activation and completion:** compare `daily_run_start` with `daily_run_complete`; segment by display mode and locale. Treat the result as consenting-player behavior, not whole-audience conversion.
2. **Stage funnel and order effects:** funnel `level_start` → `level_end` by `stage_number`, `level_name`, and `stage_count`. This exposes difficulty/order combinations that drive abandonment.
3. **Difficulty calibration:** compare stage elapsed time, stage Hints, and stage mistakes by `level_name` and board size. Use distributions or exported raw events where averages hide long tails.
4. **Hint effectiveness:** compare completion and remaining time after `hint_used`; split corrected detours from simple next-step Hints. Avoid interpreting correlation as causation because struggling players self-select into Hints.
5. **Streak retention:** segment starts/completions by incoming `streak_days`, then compare continued daily return. Browser-local resets and consent selection make this directional rather than account-level retention.
6. **Puzzle and schedule health:** use numeric `daily_number`, stage order, level, run length, time, Hints, and mistakes to identify unusually hard daily runs without exposing puzzle seeds or player paths.
7. **Home Screen experience:** compare `display_mode=standalone` with browser sessions for completion, time, and return behavior.

The daily timer is product elapsed time, not foreground-only engagement time: it pauses between stages and after reload, but a running stage can include time while its tab is hidden. GA's own engagement metrics and Twain's puzzle timer answer different questions and should not be conflated.

## Official GA references

- [Consent mode setup](https://developers.google.com/tag-platform/security/guides/consent) and [basic versus advanced behavior](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Google tag JavaScript reference](https://developers.google.com/tag-platform/gtagjs/reference)
- [Enhanced Measurement events](https://support.google.com/analytics/answer/9216061) and [event parameters](https://support.google.com/analytics/table/13594742)
- [Default GA data collection](https://support.google.com/analytics/answer/11593727) and [GA4 cookie usage](https://support.google.com/analytics/answer/11397207)
- [Recommended GA4 game events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Event collection limits](https://support.google.com/analytics/answer/9267744), [custom-dimension limits](https://support.google.com/analytics/answer/14240153), and [high-cardinality guidance](https://support.google.com/analytics/answer/12226705)
- [DebugView](https://support.google.com/analytics/answer/7201382) and [key events](https://support.google.com/analytics/answer/12571843)
