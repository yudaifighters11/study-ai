import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { AnswerHistory, AnswerHistorySchema } from "@/types/answerHistory";

export async function getAnswerHistoryByUser(
  userId: string
): Promise<AnswerHistory[]> {
  const supabase = getSupabaseClient();
  const rows = await fetchAllRows<Record<string, unknown>>(([from, to]) =>
    supabase.from("answer_history").select("*").eq("user_id", userId).range(from, to)
  );
  return rows.map((row) => AnswerHistorySchema.parse(row));
}

export async function getAnswerHistoryById(
  answerId: string
): Promise<AnswerHistory | null> {
  const { data, error } = await getSupabaseClient()
    .from("answer_history")
    .select("*")
    .eq("answer_id", answerId)
    .maybeSingle();
  if (error) throw new Error(`getAnswerHistoryById failed: ${error.message}`);
  return data ? AnswerHistorySchema.parse(data) : null;
}

export async function insertAnswerHistory(
  answer: AnswerHistory
): Promise<void> {
  const { error } = await getSupabaseClient().from("answer_history").insert(answer);
  if (error) throw new Error(`insertAnswerHistory failed: ${error.message}`);
}
