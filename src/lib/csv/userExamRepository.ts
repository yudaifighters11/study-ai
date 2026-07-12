import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { UserExam, UserExamSchema } from "@/types/userExam";

export async function getUserExams(userId: string): Promise<UserExam[]> {
  const { data, error } = await getSupabaseClient()
    .from("user_exams")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(`getUserExams failed: ${error.message}`);
  return (data ?? []).map((row) => UserExamSchema.parse(row));
}

export async function getCurrentUserExam(userId: string): Promise<UserExam | null> {
  const userExams = await getUserExams(userId);
  return userExams.find((ue) => ue.is_current) ?? null;
}

/**
 * 指定した試験をユーザーの学習対象として登録し、現在の試験として選択する。
 * 未登録の場合は新規登録し、登録済みの場合は既存の受験予定日・対象シラバス・目標スコア・最終学習日時を保持したまま選択状態のみ切り替える。
 * initialPlan は新規登録時にのみ使用する(サインアップ時に受験予定日・目標スコアを入力した場合)。既存登録がある場合は無視する。
 */
export async function registerAndSelectExam(
  userId: string,
  examId: string,
  initialPlan?: { plannedExamDate?: string | null; targetScore?: number | null }
): Promise<UserExam> {
  const supabase = getSupabaseClient();

  // 他の登録済み試験の選択状態を解除する(現在選択中は常に1つにする)
  const { error: clearError } = await supabase
    .from("user_exams")
    .update({ is_current: false })
    .eq("user_id", userId)
    .neq("exam_id", examId);
  if (clearError) {
    throw new Error(`registerAndSelectExam failed: ${clearError.message}`);
  }

  const { data: existing, error: findError } = await supabase
    .from("user_exams")
    .select("*")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .maybeSingle();
  if (findError) {
    throw new Error(`registerAndSelectExam failed: ${findError.message}`);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("user_exams")
      .update({ is_current: true })
      .eq("user_id", userId)
      .eq("exam_id", examId)
      .select()
      .single();
    if (error) throw new Error(`registerAndSelectExam failed: ${error.message}`);
    return UserExamSchema.parse(data);
  }

  const newRow = {
    user_id: userId,
    exam_id: examId,
    is_current: true,
    planned_exam_date: initialPlan?.plannedExamDate ?? null,
    target_syllabus_version: null,
    target_score: initialPlan?.targetScore ?? null,
    registered_at: new Date().toISOString(),
    last_studied_at: null,
  };
  const { data, error } = await supabase
    .from("user_exams")
    .insert(newRow)
    .select()
    .single();
  if (error) throw new Error(`registerAndSelectExam failed: ${error.message}`);
  return UserExamSchema.parse(data);
}

/**
 * 現在選択中の試験の受験予定日・対象シラバスバージョンを更新する。
 */
export async function updateCurrentExamPlan(
  userId: string,
  plannedExamDate: string,
  targetSyllabusVersion: string | null
): Promise<UserExam> {
  const current = await getCurrentUserExam(userId);
  if (!current) {
    throw new Error(`現在選択中の試験が見つかりません: user_id=${userId}`);
  }

  const { data, error } = await getSupabaseClient()
    .from("user_exams")
    .update({
      planned_exam_date: plannedExamDate,
      target_syllabus_version: targetSyllabusVersion,
    })
    .eq("user_id", userId)
    .eq("exam_id", current.exam_id)
    .select()
    .single();
  if (error) throw new Error(`updateCurrentExamPlan failed: ${error.message}`);
  return UserExamSchema.parse(data);
}

/**
 * 指定した試験の最終学習日時を更新する。ユーザーがその試験に未登録の場合は何もしない。
 */
export async function touchLastStudied(
  userId: string,
  examId: string,
  timestamp: string
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("user_exams")
    .update({ last_studied_at: timestamp })
    .eq("user_id", userId)
    .eq("exam_id", examId);
  if (error) throw new Error(`touchLastStudied failed: ${error.message}`);
}
