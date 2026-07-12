import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { updateCurrentExamStudyGoal } from "@/lib/csv/userExamRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z.object({
  monthlyStudyGoalHours: z.number().int().min(1).max(500).nullable(),
});

/**
 * マイページ「学習目標」の今月の目標学習時間の設定・変更。
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

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const updated = await updateCurrentExamStudyGoal(
      userId,
      parsed.data.monthlyStudyGoalHours
    );

    return NextResponse.json({ userExam: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
