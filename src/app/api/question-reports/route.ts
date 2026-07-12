import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { REPORT_REASONS } from "@/types/enums";
import { getQuestionById, updateQuestion } from "@/lib/csv/questionRepository";
import { insertQuestionReport } from "@/lib/csv/questionReportRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const SubmitReportSchema = z.object({
  questionId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  comment: z.string().max(1000),
});

export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function handlePost(request: NextRequest) {
  const body = await request.json();
  const parsed = SubmitReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { questionId, reason, comment } = parsed.data;

  const question = await getQuestionById(questionId);
  if (!question) {
    return NextResponse.json(
      { error: "問題が見つかりません" },
      { status: 404 }
    );
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const now = new Date().toISOString();

  await insertQuestionReport({
    report_id: uuidv4(),
    user_id: userId,
    question_id: questionId,
    reason,
    comment,
    created_at: now,
  });

  // 報告を受けた問題は、管理者が確認するまで通常の出題対象から外す。
  // 問題文・正解・解説の内容自体は変更しない。
  await updateQuestion({
    ...question,
    validation_status: "reported",
    is_current_exam_scope: false,
    updated_at: now,
  });

  return NextResponse.json({ ok: true });
}
