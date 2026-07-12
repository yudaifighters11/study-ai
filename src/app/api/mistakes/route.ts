import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getCurrentUserExam } from "@/lib/csv/userExamRepository";
import { getAnswerHistoryByUser } from "@/lib/csv/answerHistoryRepository";
import { getAllQuestions } from "@/lib/csv/questionRepository";
import { getMistakeAnalysesByUser } from "@/lib/csv/mistakeAnalysisRepository";
import { getChoiceText } from "@/lib/questionChoices";
import { MISTAKE_TYPE_LABELS, MistakeType } from "@/types/enums";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const LIMIT = 30;

export interface MistakeAnalysisSummary {
  mistakeTypeLabel: string;
  confusedConcepts: string[];
  analysisComment: string;
  recommendedTraining: string;
}

export interface MistakeListItem {
  answerId: string;
  questionId: string;
  questionText: string;
  selectedChoiceText: string;
  correctChoiceText: string;
  answeredAt: string;
  aiAnalysis: MistakeAnalysisSummary | null;
  majorCategory: string;
  middleCategory: string;
  minorCategory: string;
  detailCategory: string | null;
}

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

    const [answerHistory, allQuestions, mistakeAnalyses] = await Promise.all([
      getAnswerHistoryByUser(userId),
      getAllQuestions(currentExam.exam_id),
      getMistakeAnalysesByUser(userId),
    ]);

    const questionById = new Map(allQuestions.map((q) => [q.question_id, q]));
    const analysisByAnswerId = new Map(mistakeAnalyses.map((a) => [a.answer_id, a]));

    const items: MistakeListItem[] = answerHistory
      .filter((a) => !a.is_correct)
      .filter((a) => questionById.get(a.question_id)?.exam_type === currentExam.exam_id)
      .sort((a, b) => (a.answered_at < b.answered_at ? 1 : -1))
      .slice(0, LIMIT)
      .map((a) => {
        const question = questionById.get(a.question_id)!;
        const analysis = analysisByAnswerId.get(a.answer_id);
        return {
          answerId: a.answer_id,
          questionId: a.question_id,
          questionText: question.question_text,
          selectedChoiceText: getChoiceText(question, a.selected_choice),
          correctChoiceText: getChoiceText(question, a.evaluated_correct_choice),
          answeredAt: a.answered_at,
          majorCategory: question.major_category,
          middleCategory: question.middle_category,
          minorCategory: question.minor_category,
          detailCategory: question.detail_category,
          aiAnalysis: analysis
            ? {
                mistakeTypeLabel: MISTAKE_TYPE_LABELS[analysis.mistake_type as MistakeType],
                confusedConcepts: analysis.confused_concepts,
                analysisComment: analysis.analysis_comment,
                recommendedTraining: analysis.recommended_training,
              }
            : null,
        };
      });

    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
