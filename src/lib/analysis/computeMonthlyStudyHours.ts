import { isSameMonth, parseISO } from "date-fns";
import { AnswerHistory } from "@/types/answerHistory";

/**
 * マイページ「学習目標」の今月の目標時間カード用(AIを使わない通常の集計処理)。
 * 今月(現在選択中の試験に絞り込んだ回答履歴)の解答時間の合計を時間単位で返す。
 */
export function computeMonthlyStudyHours(
  answerHistory: Pick<AnswerHistory, "answer_time_seconds" | "answered_at">[],
  now: Date = new Date()
): number {
  const totalSeconds = answerHistory
    .filter((a) => isSameMonth(parseISO(a.answered_at), now))
    .reduce((sum, a) => sum + a.answer_time_seconds, 0);
  return totalSeconds / 3600;
}
