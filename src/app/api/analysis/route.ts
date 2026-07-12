import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getCurrentUserExam } from "@/lib/csv/userExamRepository";
import { getUserById } from "@/lib/csv/userRepository";
import { getAnswerHistoryByUser } from "@/lib/csv/answerHistoryRepository";
import { getMistakeAnalysesByUser } from "@/lib/csv/mistakeAnalysisRepository";
import { getQuestionsForFiltering } from "@/lib/csv/questionRepository";
import { computeWeakPointStats } from "@/lib/analysis/computeWeakPointStats";
import { computeHomeReminders } from "@/lib/analysis/computeHomeReminders";
import { computeMonthlyStudyHours } from "@/lib/analysis/computeMonthlyStudyHours";
import { toErrorResponse } from "@/lib/apiErrorHandler";

/**
 * 集計(正答率・弱点分析・リマインド)のみを返す。AIによる学習アドバイス生成は行わない(重いため /api/analysis/advice に分離)。
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const currentExam = await getCurrentUserExam(userId);
    if (!currentExam) {
      return NextResponse.json(
        { error: "学習対象の試験が未設定です。先に試験を選択してください。" },
        { status: 400 }
      );
    }
    const examType = currentExam.exam_id;

    const [answerHistory, mistakeAnalyses, questions, user] = await Promise.all([
      getAnswerHistoryByUser(userId),
      getMistakeAnalysesByUser(userId),
      getQuestionsForFiltering(examType),
      getUserById(userId),
    ]);

    // 試験ごとにデータを分けて集計する(複数試験を扱えるようにするための仕組み)
    const examQuestionIds = new Set(questions.map((q) => q.question_id));
    const scopedAnswerHistory = answerHistory.filter((a) =>
      examQuestionIds.has(a.question_id)
    );
    const scopedMistakeAnalyses = mistakeAnalyses.filter((a) =>
      examQuestionIds.has(a.question_id)
    );

    const stats = computeWeakPointStats(
      scopedAnswerHistory,
      scopedMistakeAnalyses,
      questions
    );

    const reminders = computeHomeReminders({
      answerHistory: scopedAnswerHistory,
      lastStudiedAt: currentExam.last_studied_at,
      plannedExamDate: currentExam.planned_exam_date,
      reviewReminderEnabled: user?.review_reminder_enabled ?? true,
      studyReminderEnabled: user?.study_reminder_enabled ?? true,
      reviewReminderThresholdDays: user?.review_reminder_threshold_days ?? 3,
      studyInactivityThresholdDays: user?.study_inactivity_threshold_days ?? 3,
      examProximityThresholdDays: user?.exam_proximity_threshold_days ?? 7,
    });

    const monthlyStudyHours = computeMonthlyStudyHours(scopedAnswerHistory);

    return NextResponse.json({ stats, reminders, monthlyStudyHours });
  } catch (error) {
    return toErrorResponse(error);
  }
}
