import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { Question, QuestionSchema } from "@/types/question";

/**
 * examTypeを指定すると、その試験の問題だけを取得する(呼び出し元が対象試験を分かっている場合は
 * 必ず指定すること。指定しないと全試験分を取得してしまい、通信量・応答時間が増える)。
 */
export async function getAllQuestions(examType?: string): Promise<Question[]> {
  const supabase = getSupabaseClient();
  const rows = await fetchAllRows<Record<string, unknown>>(([from, to]) => {
    let query = supabase.from("questions").select("*");
    if (examType) query = query.eq("exam_type", examType);
    return query.range(from, to);
  });
  return rows.map((row) => QuestionSchema.parse(row));
}

export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  const { data, error } = await getSupabaseClient()
    .from("questions")
    .select("*")
    .eq("question_id", questionId)
    .maybeSingle();
  if (error) throw new Error(`getQuestionById failed: ${error.message}`);
  return data ? QuestionSchema.parse(data) : null;
}

export async function insertQuestion(question: Question): Promise<void> {
  const { error } = await getSupabaseClient().from("questions").insert(question);
  if (error) throw new Error(`insertQuestion failed: ${error.message}`);
}

/**
 * 既存の問題を更新する(例: ユーザー報告による validation_status / is_current_exam_scope の切替)。
 * 元の問題文・正解・解説は呼び出し元が変更しない限り上書きされない。
 */
export async function updateQuestion(question: Question): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from("questions")
    .update(question)
    .eq("question_id", question.question_id)
    .select();
  if (error) throw new Error(`updateQuestion failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`Question not found: ${question.question_id}`);
  }
}
