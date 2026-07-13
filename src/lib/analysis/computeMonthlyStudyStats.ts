import { isSameMonth, parseISO } from "date-fns";
import { AnswerHistory } from "@/types/answerHistory";

export interface MonthlyStudyStats {
  hours: number;
  questionCount: number;
}

/**
 * マイページ「学習目標」の今月の目標カード用(AIを使わない通常の集計処理)。
 * 今月(現在選択中の試験に絞り込んだ回答履歴)の解答時間の合計(時間単位)と解答件数を返す。
 * 目標の種類(時間/問題数)に応じて、どちらの値を使うかは呼び出し側で選ぶ。
 */
export function computeMonthlyStudyStats(
  answerHistory: Pick<AnswerHistory, "answer_time_seconds" | "answered_at">[],
  now: Date = new Date()
): MonthlyStudyStats {
  const thisMonthAnswers = answerHistory.filter((a) =>
    isSameMonth(parseISO(a.answered_at), now)
  );
  const totalSeconds = thisMonthAnswers.reduce(
    (sum, a) => sum + a.answer_time_seconds,
    0
  );
  return {
    hours: totalSeconds / 3600,
    questionCount: thisMonthAnswers.length,
  };
}
