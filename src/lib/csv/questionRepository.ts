import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { Question, QuestionSchema } from "@/types/question";

// 出題可否の判定・弱点分析の集計にしか使わない場合の軽量な列だけを取得するための型。
// 問題文・選択肢・解説などの重いテキスト列を除くことで、通信量と応答時間を減らす。
const QuestionFilterFieldsSchema = QuestionSchema.pick({
  question_id: true,
  exam_type: true,
  question_text: true,
  major_category: true,
  middle_category: true,
  minor_category: true,
  detail_category: true,
  syllabus_version: true,
  is_current: true,
  is_current_exam_scope: true,
  passage_group_id: true,
  passage_order: true,
  passage_total_questions: true,
});
export type QuestionFilterFields = z.infer<typeof QuestionFilterFieldsSchema>;

const FILTER_COLUMNS = Object.keys(QuestionFilterFieldsSchema.shape).join(", ");

/**
 * 出題可否の判定(有効性フィルタ)・弱点分析の集計専用の軽量取得。
 * 問題文以外の重いテキスト列(選択肢・解説等)を取得しないため、getAllQuestionsより高速。
 * 実際に出題する1問が決まった後は、必ずgetQuestionByIdで全項目を取得し直すこと。
 */
export async function getQuestionsForFiltering(
  examType: string
): Promise<QuestionFilterFields[]> {
  const supabase = getSupabaseClient();
  const rows = await fetchAllRows<Record<string, unknown>>(([from, to]) =>
    supabase
      .from("questions")
      .select(FILTER_COLUMNS)
      .eq("exam_type", examType)
      .range(from, to) as unknown as PromiseLike<{
      data: Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>
  );
  return rows.map((row) => QuestionFilterFieldsSchema.parse(row));
}

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
