import { CHOICE_KEYS, MISTAKE_TYPES } from "@/types/enums";

/**
 * OpenAI Structured Outputs(response_format: json_schema, strict mode)用のJSON Schema定義。
 * プロンプトの指示だけに頼ると型がずれる(配列/文字列/真偽値の取り違え等)ことがあるため、
 * ここでAPI側に出力形式を強制させる。
 */

export const MISTAKE_ANALYSIS_JSON_SCHEMA = {
  name: "mistake_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      mistake_type: { type: "string", enum: [...MISTAKE_TYPES] },
      confused_concepts: { type: "array", items: { type: "string" } },
      analysis_comment: { type: "string" },
      recommended_training: { type: "string" },
      confidence_score: { type: "number" },
      outdated_knowledge_influence: { type: "boolean" },
    },
    required: [
      "mistake_type",
      "confused_concepts",
      "analysis_comment",
      "recommended_training",
      "confidence_score",
      "outdated_knowledge_influence",
    ],
    additionalProperties: false,
  },
} as const;

/**
 * 類題生成のJSON Schema。大分類・中分類・小分類はAIに自由記述させず、
 * detail_categoryをcategory_master.csv(試験ごと)の一覧からのenum選択にすることで、
 * 実在しない分類の組み合わせが生成されないようにする。
 */
export function buildGeneratedQuestionJsonSchema(detailCategories: string[]) {
  return {
    name: "generated_question",
    strict: true,
    schema: {
      type: "object",
      properties: {
        question_text: { type: "string" },
        choice_a: { type: "string" },
        choice_b: { type: "string" },
        choice_c: { type: "string" },
        choice_d: { type: "string" },
        choice_e: { type: ["string", "null"] },
        choice_f: { type: ["string", "null"] },
        choice_g: { type: ["string", "null"] },
        choice_h: { type: ["string", "null"] },
        correct_choice: { type: "string", enum: [...CHOICE_KEYS] },
        correct_explanation: { type: "string" },
        choice_a_explanation: { type: "string" },
        choice_b_explanation: { type: "string" },
        choice_c_explanation: { type: "string" },
        choice_d_explanation: { type: "string" },
        choice_e_explanation: { type: ["string", "null"] },
        choice_f_explanation: { type: ["string", "null"] },
        choice_g_explanation: { type: ["string", "null"] },
        choice_h_explanation: { type: ["string", "null"] },
        detail_category: { type: "string", enum: detailCategories },
        related_terms: { type: "array", items: { type: "string" } },
        difficulty: { type: "integer" },
        target_mistake_type: { type: "string", enum: [...MISTAKE_TYPES] },
        diff_from_original: { type: "string" },
        syllabus_version: { type: "string" },
        rule_reference_date: { type: "string" },
      },
      required: [
        "question_text",
        "choice_a",
        "choice_b",
        "choice_c",
        "choice_d",
        "choice_e",
        "choice_f",
        "choice_g",
        "choice_h",
        "correct_choice",
        "correct_explanation",
        "choice_a_explanation",
        "choice_b_explanation",
        "choice_c_explanation",
        "choice_d_explanation",
        "choice_e_explanation",
        "choice_f_explanation",
        "choice_g_explanation",
        "choice_h_explanation",
        "detail_category",
        "related_terms",
        "difficulty",
        "target_mistake_type",
        "diff_from_original",
        "syllabus_version",
        "rule_reference_date",
      ],
      additionalProperties: false,
    },
  } as const;
}

/**
 * 類題生成(複数設問セット)のJSON Schema。TOEIC Part7等、1つの文書を複数の設問が共有する場合に使用する。
 * questionsの件数はプロンプト側でも明示するが、strict modeがminItems/maxItemsを保証しない可能性があるため、
 * 呼び出し元(zodスキーマ)でも件数を検証する。
 */
export function buildGeneratedQuestionSetJsonSchema(
  detailCategories: string[],
  questionCount: number
) {
  const questionItemSchema = {
    type: "object",
    properties: {
      question_text: { type: "string" },
      choice_a: { type: "string" },
      choice_b: { type: "string" },
      choice_c: { type: "string" },
      choice_d: { type: "string" },
      choice_e: { type: ["string", "null"] },
      choice_f: { type: ["string", "null"] },
      choice_g: { type: ["string", "null"] },
      choice_h: { type: ["string", "null"] },
      correct_choice: { type: "string", enum: [...CHOICE_KEYS] },
      correct_explanation: { type: "string" },
      choice_a_explanation: { type: "string" },
      choice_b_explanation: { type: "string" },
      choice_c_explanation: { type: "string" },
      choice_d_explanation: { type: "string" },
      choice_e_explanation: { type: ["string", "null"] },
      choice_f_explanation: { type: ["string", "null"] },
      choice_g_explanation: { type: ["string", "null"] },
      choice_h_explanation: { type: ["string", "null"] },
      detail_category: { type: "string", enum: detailCategories },
      related_terms: { type: "array", items: { type: "string" } },
    },
    required: [
      "question_text",
      "choice_a",
      "choice_b",
      "choice_c",
      "choice_d",
      "choice_e",
      "choice_f",
      "choice_g",
      "choice_h",
      "correct_choice",
      "correct_explanation",
      "choice_a_explanation",
      "choice_b_explanation",
      "choice_c_explanation",
      "choice_d_explanation",
      "choice_e_explanation",
      "choice_f_explanation",
      "choice_g_explanation",
      "choice_h_explanation",
      "detail_category",
      "related_terms",
    ],
    additionalProperties: false,
  } as const;

  return {
    name: "generated_question_set",
    strict: true,
    schema: {
      type: "object",
      properties: {
        passage_text: { type: "string" },
        questions: {
          type: "array",
          items: questionItemSchema,
          minItems: questionCount,
          maxItems: questionCount,
        },
        difficulty: { type: "integer" },
        target_mistake_type: { type: "string", enum: [...MISTAKE_TYPES] },
        diff_from_original: { type: "string" },
        syllabus_version: { type: "string" },
        rule_reference_date: { type: "string" },
      },
      required: [
        "passage_text",
        "questions",
        "difficulty",
        "target_mistake_type",
        "diff_from_original",
        "syllabus_version",
        "rule_reference_date",
      ],
      additionalProperties: false,
    },
  } as const;
}

export const SET_VALIDATION_JSON_SCHEMA = {
  name: "generated_question_set_validation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      passage_is_self_consistent: { type: "boolean" },
      each_question_has_single_correct_choice: { type: "boolean" },
      each_question_answerable_from_passage_alone: { type: "boolean" },
      explanations_match_correct_choices: { type: "boolean" },
      choice_explanations_consistent: { type: "boolean" },
      questions_do_not_overlap: { type: "boolean" },
      within_syllabus_scope: { type: "boolean" },
      valid_at_reference_date: { type: "boolean" },
      no_outdated_terms_or_laws: { type: "boolean" },
      not_overly_copied_from_original: { type: "boolean" },
      no_ambiguous_expressions: { type: "boolean" },
      passed: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } },
    },
    required: [
      "passage_is_self_consistent",
      "each_question_has_single_correct_choice",
      "each_question_answerable_from_passage_alone",
      "explanations_match_correct_choices",
      "choice_explanations_consistent",
      "questions_do_not_overlap",
      "within_syllabus_scope",
      "valid_at_reference_date",
      "no_outdated_terms_or_laws",
      "not_overly_copied_from_original",
      "no_ambiguous_expressions",
      "passed",
      "issues",
    ],
    additionalProperties: false,
  },
} as const;

export const VALIDATION_JSON_SCHEMA = {
  name: "generated_question_validation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      has_single_correct_choice: { type: "boolean" },
      answerable_from_question_text_alone: { type: "boolean" },
      explanation_matches_correct_choice: { type: "boolean" },
      choice_explanations_consistent: { type: "boolean" },
      within_syllabus_scope: { type: "boolean" },
      valid_at_reference_date: { type: "boolean" },
      no_outdated_terms_or_laws: { type: "boolean" },
      not_overly_copied_from_original: { type: "boolean" },
      no_ambiguous_expressions: { type: "boolean" },
      passed: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } },
    },
    required: [
      "has_single_correct_choice",
      "answerable_from_question_text_alone",
      "explanation_matches_correct_choice",
      "choice_explanations_consistent",
      "within_syllabus_scope",
      "valid_at_reference_date",
      "no_outdated_terms_or_laws",
      "not_overly_copied_from_original",
      "no_ambiguous_expressions",
      "passed",
      "issues",
    ],
    additionalProperties: false,
  },
} as const;

export const STUDY_ADVICE_JSON_SCHEMA = {
  name: "study_advice",
  strict: true,
  schema: {
    type: "object",
    properties: {
      advice: { type: "string" },
    },
    required: ["advice"],
    additionalProperties: false,
  },
} as const;
