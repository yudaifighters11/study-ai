import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { QuestionReport, QuestionReportSchema } from "@/types/questionReport";

export async function getReportsByQuestionId(
  questionId: string
): Promise<QuestionReport[]> {
  const { data, error } = await getSupabaseClient()
    .from("question_reports")
    .select("*")
    .eq("question_id", questionId);
  if (error) throw new Error(`getReportsByQuestionId failed: ${error.message}`);
  return (data ?? []).map((row) => QuestionReportSchema.parse(row));
}

export async function insertQuestionReport(
  report: QuestionReport
): Promise<void> {
  const { error } = await getSupabaseClient().from("question_reports").insert(report);
  if (error) throw new Error(`insertQuestionReport failed: ${error.message}`);
}
