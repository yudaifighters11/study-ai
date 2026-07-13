import { z } from "zod";
import {
  CHOICE_KEYS,
  MISTAKE_TYPES,
  QUESTION_TYPES,
  VALIDATION_STATUSES,
} from "./enums";

/**
 * questions.csv の1行に対応するドメインモデル。
 * CSV上は全列が文字列だが、ここでは利用しやすい型(boolean/number/配列)に変換した形を正としている。
 * CSV⇔このモデルの相互変換は lib/csv/questionRepository.ts が担う。
 */
export const QuestionSchema = z.object({
  question_id: z.string().min(1),
  // どの試験の問題か。exams.csv(examRepository)に登録されている試験IDであることを実行時に検証する。
  exam_type: z.string().min(1),
  question_type: z.enum(QUESTION_TYPES),
  // AI生成問題の場合、元になった過去問のquestion_id。過去問自身の場合は null。
  original_question_id: z.string().nullable(),
  question_text: z.string().min(1),
  // Part6/7などで複数の設問が1つの文書を共有する場合の文書本文。共有文書がない問題ではnull。
  passage_text: z.string().nullable(),
  // 同じ文書を共有する設問をグループ化するID。単独の設問ではnull。
  passage_group_id: z.string().nullable(),
  // グループ内での設問の順番(1始まり)。単独の設問またはpassage_group_idがnullの場合はnull。
  passage_order: z.number().int().positive().nullable(),
  // グループ内の設問総数。単独の設問またはpassage_group_idがnullの場合はnull。
  passage_total_questions: z.number().int().positive().nullable(),
  // 選択肢は最大8択分の枠を持つ。a〜dは必須、e〜hは未使用の場合null(空欄)。
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  choice_e: z.string().nullable(),
  choice_f: z.string().nullable(),
  choice_g: z.string().nullable(),
  choice_h: z.string().nullable(),
  // 出題当時の正解
  original_correct_choice: z.enum(CHOICE_KEYS),
  // 現在のルールに基づく正解(法改正等で変更がなければoriginalと同じ値)
  current_correct_choice: z.enum(CHOICE_KEYS),
  original_explanation: z.string(),
  current_explanation: z.string(),
  choice_a_explanation: z.string(),
  choice_b_explanation: z.string(),
  choice_c_explanation: z.string(),
  choice_d_explanation: z.string(),
  choice_e_explanation: z.string().nullable(),
  choice_f_explanation: z.string().nullable(),
  choice_g_explanation: z.string().nullable(),
  choice_h_explanation: z.string().nullable(),
  major_category: z.string().min(1),
  middle_category: z.string().min(1),
  minor_category: z.string().min(1),
  // 小分類のさらに下の詳細分類。未設定の場合はnull。
  detail_category: z.string().nullable(),
  related_terms: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  // AI生成問題が対象とするミス傾向。過去問の場合は null。
  target_mistake_type: z.enum(MISTAKE_TYPES).nullable(),
  source_year: z.number().int(),
  syllabus_version: z.string().min(1),
  valid_from: z.string(), // YYYY-MM-DD
  valid_until: z.string().nullable(), // YYYY-MM-DD、無期限の場合はnull
  is_current: z.boolean(),
  is_current_exam_scope: z.boolean(),
  // 制度変更・シラバス変更などの変更理由。変更がない場合は空文字。
  revision_note: z.string(),
  validation_status: z.enum(VALIDATION_STATUSES),
  // 正解・解説の根拠とした制度の基準日(YYYY-MM-DD)
  rule_reference_date: z.string(),
  // この問題からの類題生成が(検証不合格3回連続で)自動的にブロックされているか。
  // 手動でfalseに戻せば再度類題生成を試みられる。
  similar_question_blocked: z.boolean(),
  // リスニング問題の音声ファイルURL(Supabase Storage等)。音声問題以外はnull。
  audio_url: z.string().nullable(),
  // リスニング問題のスクリプト(台本)全文。解答後の解説画面でのみ表示する。音声問題以外はnull。
  script_text: z.string().nullable(),
  created_at: z.string(), // ISO日時
  updated_at: z.string(), // ISO日時
});

export type Question = z.infer<typeof QuestionSchema>;
