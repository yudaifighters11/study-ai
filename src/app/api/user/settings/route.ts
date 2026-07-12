import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { updateReminderSettings } from "@/lib/csv/userRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z
  .object({
    reviewReminderEnabled: z.boolean().optional(),
    studyReminderEnabled: z.boolean().optional(),
  })
  .refine(
    (v) => v.reviewReminderEnabled !== undefined || v.studyReminderEnabled !== undefined,
    { message: "更新項目がありません" }
  );

/**
 * マイページの「通知・リマインド」トグル(復習リマインド・学習リマインド)の更新。
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

    const updated = await updateReminderSettings(userId, {
      ...(parsed.data.reviewReminderEnabled !== undefined && {
        review_reminder_enabled: parsed.data.reviewReminderEnabled,
      }),
      ...(parsed.data.studyReminderEnabled !== undefined && {
        study_reminder_enabled: parsed.data.studyReminderEnabled,
      }),
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
