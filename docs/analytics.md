# Analytics and Privacy

## Operating contract

Twain's optional Google Analytics 4 integration is production-configured for web stream `G-BBJX7TJD6W`, with debug mode off. `src/analytics.js` loads the Google tag only when all three gates are true:

1. `ANALYTICS_CONFIG.enabled` is `true`;
2. `ANALYTICS_CONFIG.measurementId` is a valid `G-…` or `GT-…` identifier; and
3. this browser has an explicit `granted` consent record.

Until all three gates pass, Twain creates no Google tag, `dataLayer`, or analytics request. A first visit shows the localized bottom privacy banner with direct **Decline** and **Allow analytics** actions. **Privacy details** explains the data boundary. The same choices remain available from Help → **Privacy choices**; revocation updates consent and reloads into a tag-free page.

`twain:analytics-consent:v1` is a browser-local JSON record:

```json
{
  "version": 1,
  "state": "granted",
  "updatedAt": "2026-08-26T04:05:06.000Z"
}
```

The state is `granted` or `denied`; malformed records are treated as no choice. If localStorage cannot persist the choice, analytics stays disabled and the banner remains. This is an on-device preference record, not a centrally auditable consent ledger: clearing site data removes it, and choices do not synchronize across devices. A material change to the analytics vendor, purpose, or disclosed data boundary requires a new consent-storage version and a fresh choice. Configuring the disclosed GA stream did not change that boundary, so consent record v1 remains valid.

The Google tag uses basic consent behavior. No tag is loaded before permission or after a declined page load. When permission is granted, analytics storage is granted while ad storage, ad user data, ad personalization, Google signals, and ad-personalization signals remain denied or disabled. The canonical URL is stripped of query parameters and fragments before the tag can send its initial page view.

Daily progress, streak, locale, and consent localStorage are first-party functional state. Declining optional analytics does not disable that on-device state.

## Streak contract

`twain:streak:v1` tracks `currentStreak`, `longestStreak`, `totalCompletedDays`, and `lastCompletedDate`. Only completion of every selected stage for a Taiwan calendar date records a day; opening a puzzle or completing an intermediate stage does not. Repeating or restoring the same completed day is idempotent, the next Taiwan date increments the streak, and a later gap resets only the current streak.

Streak is intentionally browser-local and has no visible UI yet. Clearing site data, changing browsers/devices, or using a private session starts a separate record. The device-clock caveat that applies to daily selection also applies to streak dates.

## Event model

Twain sends bounded outcomes, not path-level behavior. Strings are capped at 100 characters, event and parameter names follow GA limits, non-scalar values are rejected, and each event is capped at 25 parameters.

| Event | When | Material parameters |
| --- | --- | --- |
| `page_view` | The consented Google tag initializes | GA's standard page context, after URL canonicalization |
| `daily_run_start` | The first valid move or Hint starts today's first stage | `daily_number`, `daily_run_version`, `level_name`, `stage_count`, `streak_days`, `display_mode`, `ui_locale` |
| `level_start` | The first valid move or Hint starts each fresh stage | common context plus `stage_number`, `level_name`, `board_cells` |
| `hint_used` | A Hint changes the board | common/stage context plus cumulative `hint_number`, pre-Hint `occupied_cells`, `corrected`, `daily_elapsed_seconds` |
| `level_end` | A stage is solved | common/stage context plus `success`, cumulative daily time/Hints/mistakes and stage deltas when known |
| `daily_run_complete` | The final selected stage is solved | `daily_elapsed_seconds`, cumulative Hints/mistakes, stage count, current/longest streak, and total completed days |

Common context is the launch-relative numeric daily number, daily-run format version, selected UI locale, and browser versus standalone display mode. Difficulty is sent as GA's recommended `level_name`; `level_start` and `level_end` use GA's recommended game-event names.

Legacy `twain:daily:v2` play records created before stage baselines can still restore. Their cumulative totals remain valid, but unknown per-stage time/Hint/mistake deltas are omitted rather than guessed. New records persist those three baselines without changing the daily-run version or invalidating in-progress play.

Twain deliberately does not send puzzle paths, individual moves, puzzle seeds, clue values, free text, names, email addresses, account IDs, or a custom user ID. GA can still collect standard consented page, browser, device, and approximate-geography context; the notice states that boundary.

## GA4 rollout

The committed production configuration targets `G-BBJX7TJD6W`, sets `enabled: true`, and keeps `debug: false`. Repository-side browser verification intercepts the remote tag so QA cannot pollute production analytics; it proves that undecided and declined sessions are request-free, a grant initializes only the configured tag, and active revocation reloads into a tag-free page.

The remaining account-side and end-to-end rollout work is:

1. Complete the applicable Google account, data-retention, notice/legal-basis, and consent-expiry/re-prompt review for the intended jurisdictions.
2. In a non-production verification run, temporarily enable `debug`, grant analytics, and confirm the page view and all five gameplay events in DebugView. Restore `debug: false` before deployment.
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
- [Recommended GA4 game events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Event collection limits](https://support.google.com/analytics/answer/9267744), [custom-dimension limits](https://support.google.com/analytics/answer/14240153), and [high-cardinality guidance](https://support.google.com/analytics/answer/12226705)
- [DebugView](https://support.google.com/analytics/answer/7201382) and [key events](https://support.google.com/analytics/answer/12571843)
