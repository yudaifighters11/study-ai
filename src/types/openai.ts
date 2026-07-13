import { z } from "zod";
import { CHOICE_KEYS, MISTAKE_TYPES } from "./enums";

/**
 * OpenAI APIとのやり取りに関するスキーマ群。
 * OpenAIのレスポンスは信頼できない外部入力として扱い、必ずこのスキーマで検証してから使用する。
 */

// 4-1 ミス原因の分析のレスポンス
export const MistakeAnalysisResponseSchema = z.object({
  mistake_type: z.enum(MISTAKE_TYPES),
  confused_concepts: z.array(z.string()),
  analysis_comment: z.string().min(1),
  recommended_training: z.string().min(1),
  // 1問だけで断定しないための確信度(0.0〜1.0)
  confidence_score: z.number().min(0).max(1),
  // 古い知識・制度変更が誤答に影響した可能性があるか
  outdated_knowledge_influence: z.boolean(),
});
export type MistakeAnalysisResponse = z.infer<
  typeof MistakeAnalysisResponseSchema
>;

// 4-2 類題生成のレスポンス
export const GeneratedQuestionResponseSchema = z.object({
  question_text: z.string().min(1),
  // 選択肢は最大8択分の枠。a〜dは必須、e〜hは未使用の場合null(空欄)。
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  // target_choice_countが3の場合(3択問題の類題)はnull。
  choice_d: z.string().nullable(),
  choice_e: z.string().nullable(),
  choice_f: z.string().nullable(),
  choice_g: z.string().nullable(),
  choice_h: z.string().nullable(),
  correct_choice: z.enum(CHOICE_KEYS),
  correct_explanation: z.string().min(1),
  choice_a_explanation: z.string().min(1),
  choice_b_explanation: z.string().min(1),
  choice_c_explanation: z.string().min(1),
  choice_d_explanation: z.string().nullable(),
  choice_e_explanation: z.string().nullable(),
  choice_f_explanation: z.string().nullable(),
  choice_g_explanation: z.string().nullable(),
  choice_h_explanation: z.string().nullable(),
  // 大分類・中分類・小分類はAIには決めさせず、detail_categoryからcategory_master.csvを逆引きして決定する。
  detail_category: z.string().min(1),
  related_terms: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  target_mistake_type: z.enum(MISTAKE_TYPES),
  // 元問題との違い(単純な数値・文言変更ではないことの説明)
  diff_from_original: z.string().min(1),
  syllabus_version: z.string().min(1),
  rule_reference_date: z.string(), // YYYY-MM-DD
});
export type GeneratedQuestionResponse = z.infer<
  typeof GeneratedQuestionResponseSchema
>;

// 4-2 類題生成(複数設問セット)のレスポンス。TOEIC Part7等、1つの文書を複数の設問が共有する場合に使用する。
export const GeneratedQuestionSetItemSchema = z.object({
  question_text: z.string().min(1),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  // target_choice_countが3の場合(3択問題の類題)はnull。
  choice_d: z.string().nullable(),
  choice_e: z.string().nullable(),
  choice_f: z.string().nullable(),
  choice_g: z.string().nullable(),
  choice_h: z.string().nullable(),
  correct_choice: z.enum(CHOICE_KEYS),
  correct_explanation: z.string().min(1),
  choice_a_explanation: z.string().min(1),
  choice_b_explanation: z.string().min(1),
  choice_c_explanation: z.string().min(1),
  choice_d_explanation: z.string().nullable(),
  choice_e_explanation: z.string().nullable(),
  choice_f_explanation: z.string().nullable(),
  choice_g_explanation: z.string().nullable(),
  choice_h_explanation: z.string().nullable(),
  // 大分類・中分類・小分類はAIには決めさせず、detail_categoryからcategory_master.csvを逆引きして決定する。
  detail_category: z.string().min(1),
  related_terms: z.array(z.string()),
});
export type GeneratedQuestionSetItem = z.infer<
  typeof GeneratedQuestionSetItemSchema
>;

export function buildGeneratedQuestionSetResponseSchema(questionCount: number) {
  return z.object({
    // 設問が共有する文書本文
    passage_text: z.string().min(1),
    questions: z.array(GeneratedQuestionSetItemSchema).length(questionCount),
    difficulty: z.number().int().min(1).max(5),
    target_mistake_type: z.enum(MISTAKE_TYPES),
    // 元問題との違い(セット全体としての説明)
    diff_from_original: z.string().min(1),
    syllabus_version: z.string().min(1),
    rule_reference_date: z.string(), // YYYY-MM-DD
  });
}
export type GeneratedQuestionSetResponse = z.infer<
  ReturnType<typeof buildGeneratedQuestionSetResponseSchema>
>;

// 4-3 生成問題セットのチェックのレスポンス
export const SetValidationResponseSchema = z.object({
  passage_is_self_consistent: z.boolean(),
  each_question_has_single_correct_choice: z.boolean(),
  each_question_answerable_from_passage_alone: z.boolean(),
  explanations_match_correct_choices: z.boolean(),
  choice_explanations_consistent: z.boolean(),
  // 同じセット内の設問同士が、同じ箇所・同じ情報を重複して問うていないか
  questions_do_not_overlap: z.boolean(),
  within_syllabus_scope: z.boolean(),
  valid_at_reference_date: z.boolean(),
  no_outdated_terms_or_laws: z.boolean(),
  not_overly_copied_from_original: z.boolean(),
  no_ambiguous_expressions: z.boolean(),
  // 上記すべてを満たす場合のみtrue
  passed: z.boolean(),
  // 不合格項目がある場合の理由(合格時は空配列)
  issues: z.array(z.string()),
});
export type SetValidationResponse = z.infer<typeof SetValidationResponseSchema>;

// 4-3 生成問題のチェックのレスポンス
export const ValidationResponseSchema = z.object({
  has_single_correct_choice: z.boolean(),
  answerable_from_question_text_alone: z.boolean(),
  explanation_matches_correct_choice: z.boolean(),
  choice_explanations_consistent: z.boolean(),
  within_syllabus_scope: z.boolean(),
  valid_at_reference_date: z.boolean(),
  no_outdated_terms_or_laws: z.boolean(),
  not_overly_copied_from_original: z.boolean(),
  no_ambiguous_expressions: z.boolean(),
  // 上記すべてを満たす場合のみtrue
  passed: z.boolean(),
  // 不合格項目がある場合の理由(合格時は空配列)
  issues: z.array(z.string()),
});
export type ValidationResponse = z.infer<typeof ValidationResponseSchema>;

// 7-5 弱点分析画面: AIからの学習アドバイスのレスポンス
export const StudyAdviceResponseSchema = z.object({
  advice: z.string().min(1),
});
export type StudyAdviceResponse = z.infer<typeof StudyAdviceResponseSchema>;

// TOEICリスニング Part2(応答問題)の新規生成レスポンス。
// 過去問(originalQuestion)が存在しない、指定したtopicから直接生成する形式のため、
// 類題生成(4-2)とはスキーマを分けている。選択肢は常に3択(a/b/c)。
export const GeneratedListeningQuestionResponseSchema = z.object({
  question_text: z.string().min(1),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  correct_choice: z.enum(["a", "b", "c"]),
  correct_explanation: z.string().min(1),
  choice_a_explanation: z.string().min(1),
  choice_b_explanation: z.string().min(1),
  choice_c_explanation: z.string().min(1),
  minor_category: z.string().min(1),
  related_terms: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
});
export type GeneratedListeningQuestionResponse = z.infer<
  typeof GeneratedListeningQuestionResponseSchema
>;

// TOEICリスニング Part2生成問題のチェック(4-3相当)のレスポンス。
// 元問題との比較観点(not_overly_copied_from_original等)がない代わりに、
// 音声のみで解答できるか・3択形式を守っているかを確認する。
export const ListeningValidationResponseSchema = z.object({
  is_three_choice_format: z.boolean(),
  has_single_correct_choice: z.boolean(),
  answerable_from_audio_alone: z.boolean(),
  explanation_matches_correct_choice: z.boolean(),
  choice_explanations_consistent: z.boolean(),
  matches_requested_topic: z.boolean(),
  natural_toeic_style_english: z.boolean(),
  no_ambiguous_expressions: z.boolean(),
  passed: z.boolean(),
  issues: z.array(z.string()),
});
export type ListeningValidationResponse = z.infer<
  typeof ListeningValidationResponseSchema
>;
