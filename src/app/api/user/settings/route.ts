import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { updateUserSettings } from "@/lib/csv/userRepository";
import { PlanSchema } from "@/types/user";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z
  .object({
    reviewReminderEnabled: z.boolean().optional(),
    studyReminderEnabled: z.boolean().optional(),
    reviewReminderThresholdDays: z.number().int().min(1).max(60).optional(),
    studyInactivityThresholdDays: z.number().int().min(1).max(60).optional(),
    examProximityThresholdDays: z.number().int().min(1).max(60).optional(),
    listeningShowQuestionText: z.boolean().optional(),
    listeningShowChoiceText: z.boolean().optional(),
    // 決済機能は未実装のため、マイページの簡易トグルから直接切り替えられるようにしている。
    plan: PlanSchema.optional(),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), {
    message: "更新項目がありません",
  });

/**
 * マイページの「通知・リマインド」設定(復習・学習リマインドのON/OFFと日数しきい値)の更新。
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

    const updated = await updateUserSettings(userId, {
      ...(parsed.data.reviewReminderEnabled !== undefined && {
        review_reminder_enabled: parsed.data.reviewReminderEnabled,
      }),
      ...(parsed.data.studyReminderEnabled !== undefined && {
        study_reminder_enabled: parsed.data.studyReminderEnabled,
      }),
      ...(parsed.data.reviewReminderThresholdDays !== undefined && {
        review_reminder_threshold_days: parsed.data.reviewReminderThresholdDays,
      }),
      ...(parsed.data.studyInactivityThresholdDays !== undefined && {
        study_inactivity_threshold_days: parsed.data.studyInactivityThresholdDays,
      }),
      ...(parsed.data.examProximityThresholdDays !== undefined && {
        exam_proximity_threshold_days: parsed.data.examProximityThresholdDays,
      }),
      ...(parsed.data.listeningShowQuestionText !== undefined && {
        listening_show_question_text: parsed.data.listeningShowQuestionText,
      }),
      ...(parsed.data.listeningShowChoiceText !== undefined && {
        listening_show_choice_text: parsed.data.listeningShowChoiceText,
      }),
      ...(parsed.data.plan !== undefined && {
        plan: parsed.data.plan,
      }),
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
