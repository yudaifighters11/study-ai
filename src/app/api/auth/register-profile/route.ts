import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/authServerClient";
import { ensureUserProfile } from "@/lib/csv/userRepository";
import { registerAndSelectExam } from "@/lib/csv/userExamRepository";
import { getAllExams } from "@/lib/csv/examRepository";
import { AgeGroupSchema, OccupationSchema } from "@/types/user";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z.object({
  displayName: z.string().min(1).max(50),
  examId: z.string().min(1),
  termsAgreed: z.literal(true),
  ageGroup: AgeGroupSchema.nullable(),
  occupation: OccupationSchema.nullable(),
  plannedExamDate: z.string().nullable(), // YYYY-MM-DD。未定の場合はnull
  targetScore: z.number().int().nullable(), // 未定の場合はnull
});

/**
 * サインアップ直後にクライアントから呼ばれ、自社のusersテーブルへプロフィール行を作成し、
 * 最初に学習する試験を登録する。
 * Supabase Auth自体のユーザー作成(auth.users)とは別に、表示名等の追加プロフィール情報を保持するために必要。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力値が不正です", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const exams = await getAllExams();
    if (!exams.some((e) => e.exam_id === parsed.data.examId)) {
      return NextResponse.json(
        { error: "指定された試験が見つかりません" },
        { status: 404 }
      );
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    await ensureUserProfile({
      user_id: user.id,
      display_name: parsed.data.displayName,
      email: user.email,
      age_group: parsed.data.ageGroup,
      occupation: parsed.data.occupation,
      terms_agreed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    await registerAndSelectExam(user.id, parsed.data.examId, {
      plannedExamDate: parsed.data.plannedExamDate,
      targetScore: parsed.data.targetScore,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
