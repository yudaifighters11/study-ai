/**
 * サービス全体で共有する固定値の定義。
 * CSVの列やOpenAIレスポンスの分類値はすべてここに集約する。
 */

export const QUESTION_TYPES = ["original", "ai_generated"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// 選択肢の枠は最大8択分用意する。a〜cは必須、d〜hは未使用の場合は空欄(null)にする(TOEICリスニングPart2等の3択問題ではdもnull)。
export const CHOICE_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export type ChoiceKey = (typeof CHOICE_KEYS)[number];
// 常に埋まっている(必須の)選択肢キー
export const REQUIRED_CHOICE_KEYS = ["a", "b", "c", "d"] as const;
// 任意(未使用の場合は空欄)の選択肢キー
export const OPTIONAL_CHOICE_KEYS = ["e", "f", "g", "h"] as const;

// セクション3で定義されたミス傾向の分類
export const MISTAKE_TYPES = [
  "knowledge_gap", // 知識が不足している
  "term_confusion", // 似た用語を混同している
  "misread_question", // 問題文を読み違えている
  "wrong_after_narrowing_to_two", // 二択まで絞った後に誤っている
  "confident_but_wrong", // 自信を持って誤答している
  "repeated_topic_mistake", // 特定の論点を繰り返し間違えている
] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number];

export const MISTAKE_TYPE_LABELS: Record<MistakeType, string> = {
  knowledge_gap: "知識が不足している",
  term_confusion: "似た用語を混同している",
  misread_question: "問題文を読み違えている",
  wrong_after_narrowing_to_two: "二択まで絞った後に誤っている",
  confident_but_wrong: "自信を持って誤答している",
  repeated_topic_mistake: "特定の論点を繰り返し間違えている",
};

// 自信度(見た目は通常のボタン3択)
export const CONFIDENCE_LEVELS = ["confident", "unsure", "unknown"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  confident: "自信あり",
  unsure: "迷った",
  unknown: "分からない",
};

// AI生成問題の検証状態(4-3のチェック結果)。過去問はvalidation対象外。
// "reported"はユーザーからの報告により出題対象から外れた状態。
export const VALIDATION_STATUSES = [
  "not_applicable",
  "pending",
  "passed",
  "failed",
  "reported",
] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

// 7-4 AI類題画面の「問題内容を報告する」で選べる理由
export const REPORT_REASONS = [
  "incorrect_answer",
  "unclear_question",
  "inappropriate_content",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  incorrect_answer: "正解が間違っている",
  unclear_question: "問題文が分かりにくい・曖昧",
  inappropriate_content: "不適切な内容が含まれている",
  other: "その他",
};

// シラバス変更点の種類(1回の改定に複数件記録できるようにするための分類)
export const SYLLABUS_CHANGE_TYPES = [
  "law_added", // 法令・制度の追加
  "law_removed", // 法令・制度の廃止
  "term_renamed", // 用語の名称変更
  "topic_added", // 出題範囲への論点追加
  "topic_removed", // 出題範囲からの論点除外
  "other", // その他
] as const;
export type SyllabusChangeType = (typeof SYLLABUS_CHANGE_TYPES)[number];

export const SYLLABUS_CHANGE_TYPE_LABELS: Record<SyllabusChangeType, string> = {
  law_added: "法令・制度の追加",
  law_removed: "法令・制度の廃止",
  term_renamed: "用語の名称変更",
  topic_added: "出題範囲への論点追加",
  topic_removed: "出題範囲からの論点除外",
  other: "その他",
};

// この変更点について、影響を受ける過去問の確認・反映が済んでいるか
export const SYLLABUS_CHANGE_STATUSES = ["identified", "applied"] as const;
export type SyllabusChangeStatus = (typeof SYLLABUS_CHANGE_STATUSES)[number];
