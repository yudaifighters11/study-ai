import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getExamLabel } from "@/lib/csv/examRepository";
import { getCurrentUserExam } from "@/lib/csv/userExamRepository";
import { getAnswerHistoryByUser } from "@/lib/csv/answerHistoryRepository";
import { getMistakeAnalysesByUser } from "@/lib/csv/mistakeAnalysisRepository";
import { getQuestionsForFiltering } from "@/lib/csv/questionRepository";
import { computeWeakPointStats } from "@/lib/analysis/computeWeakPointStats";
import { generateStudyAdvice } from "@/lib/openai/generateStudyAdvice";
import { toErrorResponse } from "@/lib/apiErrorHandler";

/**
 * AIによる学習アドバイス(弱点分析画面専用)のみを返す。
 * /api/analysis(集計)とは別リクエストにすることで、AI呼び出しの遅延が集計の表示をブロックしないようにする。
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

    const [answerHistory, mistakeAnalyses, questions] = await Promise.all([
      getAnswerHistoryByUser(userId),
      getMistakeAnalysesByUser(userId),
      getQuestionsForFiltering(examType),
    ]);

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

    if (stats.totalAnswers === 0) {
      return NextResponse.json({ advice: null, adviceError: null });
    }

    let advice: string | null = null;
    let adviceError: string | null = null;
    try {
      const examLabel = await getExamLabel(examType);
      const result = await generateStudyAdvice(stats, examLabel);
      advice = result.advice;
    } catch (error) {
      console.error("generateStudyAdvice failed:", error);
      adviceError =
        error instanceof Error
          ? error.message
          : "学習アドバイスの生成でエラーが発生しました";
    }

    return NextResponse.json({ advice, adviceError });
  } catch (error) {
    return toErrorResponse(error);
  }
}
