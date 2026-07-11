import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFixedUserId } from "@/lib/config";
import { getUserById } from "@/lib/csv/userRepository";
import {
  getCurrentUserExam,
  updateCurrentExamPlan,
} from "@/lib/csv/userExamRepository";
import { getAllSyllabusVersions } from "@/lib/csv/syllabusRepository";
import { determineSyllabusForDate } from "@/lib/syllabus/determineSyllabus";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const SetPlannedExamDateSchema = z.object({
  plannedExamDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください"),
});

export async function GET() {
  try {
    const userId = getFixedUserId();
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ user });
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
  const parsed = SetPlannedExamDateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = getFixedUserId();
  const currentExam = await getCurrentUserExam(userId);
  if (!currentExam) {
    return NextResponse.json(
      { error: "学習対象の試験が未設定です。先に試験を選択してください。" },
      { status: 400 }
    );
  }

  // シラバスバージョンが登録されている試験の場合のみ、対象シラバスを判定する。
  // シラバス体系を持たない試験(TOEIC等)は、現時点ではnullのままとする。
  let targetSyllabusVersion: string | null = null;
  const syllabusVersions = await getAllSyllabusVersions();
  const hasSyllabusSystem = syllabusVersions.some(
    (sv) => sv.exam_type === currentExam.exam_id
  );
  if (hasSyllabusSystem) {
    const syllabus = determineSyllabusForDate(
      parsed.data.plannedExamDate,
      syllabusVersions,
      currentExam.exam_id
    );
    if (!syllabus) {
      return NextResponse.json(
        { error: "受験予定日に対応するシラバスバージョンが見つかりませんでした" },
        { status: 422 }
      );
    }
    targetSyllabusVersion = syllabus.syllabus_version;
  }

  const updated = await updateCurrentExamPlan(
    userId,
    parsed.data.plannedExamDate,
    targetSyllabusVersion
  );

  return NextResponse.json({ userExam: updated });
}
