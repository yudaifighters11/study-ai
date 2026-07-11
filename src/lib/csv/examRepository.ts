import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { Exam, ExamSchema } from "@/types/exam";

export async function getAllExams(): Promise<Exam[]> {
  const { data, error } = await getSupabaseClient()
    .from("exams")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`getAllExams failed: ${error.message}`);
  return (data ?? []).map((row) => ExamSchema.parse(row));
}

export async function getExamById(examId: string): Promise<Exam | null> {
  const exams = await getAllExams();
  return exams.find((e) => e.exam_id === examId) ?? null;
}

/**
 * プロンプトや画面表示用に、試験IDから表示名を取得する。
 * exams.csvに存在しない場合は、examIdをそのままフォールバック表示する。
 */
export async function getExamLabel(examId: string): Promise<string> {
  const exam = await getExamById(examId);
  return exam?.name ?? examId;
}
