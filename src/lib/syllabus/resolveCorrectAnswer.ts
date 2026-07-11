import { ChoiceKey } from "@/types/enums";
import { Question } from "@/types/question";

export type AnswerEvaluationMode = "current_rule" | "original_rule";

/**
 * 過去時点と現在時点の正解を切り替える(セクション6-2の手順6、セクション7-3対応)。
 * 通常演習では現在有効な問題を出題するため、既定値は current_rule で評価する。
 * 過去問を出題当時のまま確認する場合は original_rule を指定する。
 */
export function resolveEvaluationChoice(
  question: Question,
  mode: AnswerEvaluationMode = "current_rule"
): ChoiceKey {
  return mode === "original_rule"
    ? question.original_correct_choice
    : question.current_correct_choice;
}

export function hasCorrectAnswerChanged(question: Question): boolean {
  return question.original_correct_choice !== question.current_correct_choice;
}
