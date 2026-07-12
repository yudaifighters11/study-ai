import { differenceInCalendarDays } from "date-fns";
import { AnswerHistory } from "@/types/answerHistory";

/**
 * ホーム画面のリマインドバナー用の集計処理(AIを使わない通常の集計処理)。
 * 各しきい値(日数)はマイページの「通知・リマインド」でユーザーごとに設定できる。
 */

export interface HomeReminders {
  // 不正解のまま一定期間解き直していない問題の数
  reviewNeededCount: number;
  // 最終学習日からの経過日数(未学習の場合はnull)
  daysSinceLastStudy: number | null;
  // 受験予定日までの残り日数(未設定または過去の場合はnull)
  daysUntilExam: number | null;
  // 学習リマインドを表示すべきか(未学習が続いている、または受験予定日が近い)
  showStudyReminder: boolean;
}

type ReminderAnswer = Pick<AnswerHistory, "question_id" | "is_correct" | "answered_at">;

export function computeHomeReminders(params: {
  answerHistory: ReminderAnswer[];
  lastStudiedAt: string | null;
  plannedExamDate: string | null;
  // マイページの「通知・リマインド」トグル。falseの場合はそのリマインドを常に非表示にする。
  reviewReminderEnabled: boolean;
  studyReminderEnabled: boolean;
  // 不正解のまま何日経過したら「復習が必要」とみなすか
  reviewReminderThresholdDays: number;
  // 最終学習日から何日経過したら「学習リマインド」を出すか
  studyInactivityThresholdDays: number;
  // 受験予定日まで何日以内なら「学習リマインド」を出すか
  examProximityThresholdDays: number;
  now?: Date;
}): HomeReminders {
  const now = params.now ?? new Date();

  let reviewNeededCount = 0;
  if (params.reviewReminderEnabled) {
    // 問題ごとに最新の回答のみを見る(後で解き直して正解していれば復習不要とみなす)
    const latestByQuestion = new Map<string, ReminderAnswer>();
    for (const answer of params.answerHistory) {
      const existing = latestByQuestion.get(answer.question_id);
      if (!existing || answer.answered_at > existing.answered_at) {
        latestByQuestion.set(answer.question_id, answer);
      }
    }

    for (const answer of latestByQuestion.values()) {
      if (answer.is_correct) continue;
      if (
        differenceInCalendarDays(now, new Date(answer.answered_at)) >=
        params.reviewReminderThresholdDays
      ) {
        reviewNeededCount += 1;
      }
    }
  }

  const daysSinceLastStudy = params.lastStudiedAt
    ? differenceInCalendarDays(now, new Date(params.lastStudiedAt))
    : null;

  const daysUntilExamRaw = params.plannedExamDate
    ? differenceInCalendarDays(new Date(params.plannedExamDate), now)
    : null;
  const daysUntilExam = daysUntilExamRaw !== null && daysUntilExamRaw >= 0 ? daysUntilExamRaw : null;

  const showStudyReminder =
    params.studyReminderEnabled &&
    ((daysSinceLastStudy !== null &&
      daysSinceLastStudy >= params.studyInactivityThresholdDays) ||
      (daysUntilExam !== null && daysUntilExam <= params.examProximityThresholdDays));

  return { reviewNeededCount, daysSinceLastStudy, daysUntilExam, showStudyReminder };
}
