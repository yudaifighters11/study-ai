import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { updateCurrentExamTargetScore } from "@/lib/csv/userExamRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z.object({
  targetScore: z.number().int().min(1).max(10000).nullable(),
});

/**
 * マイページの現在選択中の試験に対する目標スコア・目標点の設定・変更。
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

    const updated = await updateCurrentExamTargetScore(userId, parsed.data.targetScore);

    return NextResponse.json({ userExam: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
