import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFixedUserId } from "@/lib/config";
import { getAllExams } from "@/lib/csv/examRepository";
import { getUserExams, registerAndSelectExam } from "@/lib/csv/userExamRepository";
import { getAllSyllabusVersions } from "@/lib/csv/syllabusRepository";
import { toRegisteredExam } from "@/lib/examPresenter";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const SelectExamSchema = z.object({
  examId: z.string().min(1),
});

export async function GET() {
  try {
    const userId = getFixedUserId();
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

    return NextResponse.json({ current, registered });
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

  const userId = getFixedUserId();
  const userExam = await registerAndSelectExam(userId, parsed.data.examId);

  const syllabusVersions = await getAllSyllabusVersions();
  const hasSyllabus = syllabusVersions.some((sv) => sv.exam_type === exam.exam_id);

  return NextResponse.json({
    current: toRegisteredExam(userExam, exam, hasSyllabus),
  });
}
