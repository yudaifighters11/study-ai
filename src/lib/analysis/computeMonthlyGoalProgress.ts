import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";

export interface MonthlyGoalProgress {
  monthStart: string; // YYYY-MM-DD(今月の1日)
  monthEnd: string; // YYYY-MM-DD(今月の末日)
  daysElapsed: number; // 今月の経過日数(今日を含む)
  daysInMonth: number; // 今月の日数
  // 現在のペース(実績 ÷ 経過日数)を月末まで維持した場合の予測値
  projectedValue: number;
  // 予測値が目標値以上かどうか
  achievable: boolean;
}

/**
 * ホーム画面「今月の目標」の進捗予測(AIを使わない通常の集計処理)。
 * 現在のペースを維持した場合、月末時点でどれくらいの実績になりそうかを単純な線形予測で算出する。
 */
export function computeMonthlyGoalProgress(
  actualValue: number,
  targetValue: number,
  now: Date = new Date()
): MonthlyGoalProgress {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = getDaysInMonth(now);
  const daysElapsed = differenceInCalendarDays(now, monthStart) + 1;
  const projectedValue =
    daysElapsed > 0 ? (actualValue / daysElapsed) * daysInMonth : actualValue;

  return {
    monthStart: format(monthStart, "yyyy-MM-dd"),
    monthEnd: format(monthEnd, "yyyy-MM-dd"),
    daysElapsed,
    daysInMonth,
    projectedValue,
    achievable: projectedValue >= targetValue,
  };
}
