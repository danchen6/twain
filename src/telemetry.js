function roundedSeconds(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("Telemetry duration must be nonnegative.");
  }

  return Math.round(milliseconds / 1000);
}

function commonParameters({
  dailyNumber,
  dailyRunVersion,
  displayMode,
  locale,
}) {
  return {
    daily_number: dailyNumber,
    daily_run_version: dailyRunVersion,
    display_mode: displayMode,
    ui_locale: locale,
  };
}

export function dailyRunStartEvent({
  dailyNumber,
  dailyRunVersion,
  difficulty,
  displayMode,
  locale,
  stageCount,
  streakDays,
}) {
  return {
    name: "daily_run_start",
    parameters: {
      ...commonParameters({
        dailyNumber,
        dailyRunVersion,
        displayMode,
        locale,
      }),
      level_name: difficulty,
      stage_count: stageCount,
      streak_days: streakDays,
    },
  };
}

export function levelStartEvent({
  boardCells,
  dailyNumber,
  dailyRunVersion,
  difficulty,
  displayMode,
  locale,
  stageCount,
  stageNumber,
}) {
  return {
    name: "level_start",
    parameters: {
      ...commonParameters({
        dailyNumber,
        dailyRunVersion,
        displayMode,
        locale,
      }),
      board_cells: boardCells,
      level_name: difficulty,
      stage_count: stageCount,
      stage_number: stageNumber,
    },
  };
}

export function hintUsedEvent({
  boardCells,
  corrected,
  dailyElapsedMs,
  dailyNumber,
  dailyRunVersion,
  difficulty,
  displayMode,
  hintNumber,
  locale,
  occupiedCells,
  stageCount,
  stageNumber,
}) {
  return {
    name: "hint_used",
    parameters: {
      ...commonParameters({
        dailyNumber,
        dailyRunVersion,
        displayMode,
        locale,
      }),
      board_cells: boardCells,
      corrected,
      daily_elapsed_seconds: roundedSeconds(dailyElapsedMs),
      hint_number: hintNumber,
      level_name: difficulty,
      occupied_cells: occupiedCells,
      stage_count: stageCount,
      stage_number: stageNumber,
    },
  };
}

export function levelEndEvent({
  boardCells,
  dailyElapsedMs,
  dailyNumber,
  dailyRunVersion,
  difficulty,
  displayMode,
  hintsUsedTotal,
  locale,
  mistakesTotal,
  stageCount,
  stageElapsedMs,
  stageHints,
  stageMistakes,
  stageNumber,
}) {
  return {
    name: "level_end",
    parameters: {
      ...commonParameters({
        dailyNumber,
        dailyRunVersion,
        displayMode,
        locale,
      }),
      board_cells: boardCells,
      daily_elapsed_seconds: roundedSeconds(dailyElapsedMs),
      hints_used_total: hintsUsedTotal,
      level_name: difficulty,
      mistakes_total: mistakesTotal,
      stage_count: stageCount,
      stage_elapsed_seconds:
        stageElapsedMs === null ? null : roundedSeconds(stageElapsedMs),
      stage_hints: stageHints,
      stage_mistakes: stageMistakes,
      stage_number: stageNumber,
      success: true,
    },
  };
}

export function dailyRunCompleteEvent({
  dailyElapsedMs,
  dailyNumber,
  dailyRunVersion,
  displayMode,
  hintsUsedTotal,
  locale,
  mistakesTotal,
  stageCount,
  streak,
}) {
  return {
    name: "daily_run_complete",
    parameters: {
      ...commonParameters({
        dailyNumber,
        dailyRunVersion,
        displayMode,
        locale,
      }),
      completed_days_total: streak.totalCompletedDays,
      daily_elapsed_seconds: roundedSeconds(dailyElapsedMs),
      hints_used_total: hintsUsedTotal,
      longest_streak_days: streak.longestStreak,
      mistakes_total: mistakesTotal,
      stage_count: stageCount,
      streak_days: streak.currentStreak,
    },
  };
}
