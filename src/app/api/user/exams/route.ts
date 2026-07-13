import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getAllExams } from "@/lib/csv/examRepository";
import { getUserExams, registerAndSelectExam } from "@/lib/csv/userExamRepository";
import { getAllSyllabusVersions } from "@/lib/csv/syllabusRepository";
import { getAnswerHistoryByUser } from "@/lib/csv/answerHistoryRepository";
import { getQuestionsForFiltering } from "@/lib/csv/questionRepository";
import { toRegisteredExam } from "@/lib/examPresenter";
import { toErrorResponse } from "@/lib/apiErrorHandler";

// マイページ「学習中の試験」の表示基準(この問題数以上解いた試験を表示する)
const STUDYING_EXAM_MIN_ANSWERS = 10;

const SelectExamSchema = z.object({
  examId: z.string().min(1),
});

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const [userExams, exams, syllabusVersions] = await Promise.all([
      getUserExams(userId),
      getAllExams(),
      getAllSyllabusVersions(),
    ]);
    const examById = new Map(exams.map((e) => [e.exam_id, e]));
    const examIdsWithSyllabus = new Set(syllabusVersions.map((sv) => sv.exam_type));

    const registered = userExams.map((ue) =>
      toRegisteredExam(
        ue,
        examById.get(ue.exam_id) ?? null,
        examIdsWithSyllabus.has(ue.exam_id)
      )
    );
    const current = registered.find((r) => r.is_current) ?? null;

    // マイページの「学習中の試験」: 実際に一定数以上解いた試験のみを表示する(登録しただけの試験は含めない)。
    const answerHistory = await getAnswerHistoryByUser(userId);
    const studyingExams: { examId: string; name: string; answeredCount: number }[] = [];
    for (const ue of userExams) {
      const exam = examById.get(ue.exam_id);
      if (!exam) continue;
      const questions = await getQuestionsForFiltering(ue.exam_id);
      const questionIds = new Set(questions.map((q) => q.question_id));
      const answeredCount = answerHistory.filter((a) =>
        questionIds.has(a.question_id)
      ).length;
      if (answeredCount >= STUDYING_EXAM_MIN_ANSWERS) {
        studyingExams.push({ examId: ue.exam_id, name: exam.name, answeredCount });
      }
    }

    return NextResponse.json({ current, registered, studyingExams });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function handlePost(request: NextRequest) {
  const body = await request.json();
  const parsed = SelectExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const exam = await getAllExams().then((exams) =>
    exams.find((e) => e.exam_id === parsed.data.examId)
  );
  if (!exam) {
    return NextResponse.json(
      { error: "指定された試験が見つかりません" },
      { status: 404 }
    );
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userExam = await registerAndSelectExam(userId, parsed.data.examId);

  const syllabusVersions = await getAllSyllabusVersions();
  const hasSyllabus = syllabusVersions.some((sv) => sv.exam_type === exam.exam_id);

  return NextResponse.json({
    current: toRegisteredExam(userExam, exam, hasSyllabus),
  });
}
