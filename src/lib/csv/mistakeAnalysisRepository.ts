import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { MistakeAnalysis, MistakeAnalysisSchema } from "@/types/mistakeAnalysis";

export async function getMistakeAnalysesByUser(
  userId: string
): Promise<MistakeAnalysis[]> {
  const supabase = getSupabaseClient();
  const rows = await fetchAllRows<Record<string, unknown>>(([from, to]) =>
    supabase.from("mistake_analyses").select("*").eq("user_id", userId).range(from, to)
  );
  return rows.map((row) => MistakeAnalysisSchema.parse(row));
}

export async function getMistakeAnalysisByAnswerId(
  answerId: string
): Promise<MistakeAnalysis | null> {
  const { data, error } = await getSupabaseClient()
    .from("mistake_analyses")
    .select("*")
    .eq("answer_id", answerId)
    .maybeSingle();
  if (error) throw new Error(`getMistakeAnalysisByAnswerId failed: ${error.message}`);
  return data ? MistakeAnalysisSchema.parse(data) : null;
}

export async function insertMistakeAnalysis(
  analysis: MistakeAnalysis
): Promise<void> {
  const { error } = await getSupabaseClient().from("mistake_analyses").insert(analysis);
  if (error) throw new Error(`insertMistakeAnalysis failed: ${error.message}`);
}
