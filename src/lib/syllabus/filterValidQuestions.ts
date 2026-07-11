import { Question } from "@/types/question";

/**
 * syllabusVersionがnullの場合は、シラバス体系を持たない試験(TOEIC等)とみなし、
 * シラバスバージョンの一致は問わずis_current/is_current_exam_scopeのみで判定する。
 */
function isCurrentlyValid(
  question: Question,
  syllabusVersion: string | null
): boolean {
  if (syllabusVersion !== null && question.syllabus_version !== syllabusVersion) {
    return false;
  }
  return question.is_current && question.is_current_exam_scope;
}

/**
 * 指定シラバスバージョンで、通常演習の出題対象となる問題を抽出する(セクション6-2の手順3〜4)。
 */
export function filterValidQuestions(
  questions: Question[],
  syllabusVersion: string | null,
  examType: string
): Question[] {
  return questions.filter(
    (q) => q.exam_type === examType && isCurrentlyValid(q, syllabusVersion)
  );
}

/**
 * 「過去の問題を見る」モード用: 現行の出題対象ではない問題(旧シラバス・出題対象外・無効化済み)を抽出する。
 * セクション6-2の手順5(古い問題を出題する場合の扱い)に対応。
 */
export function filterHistoricalQuestions(
  questions: Question[],
  syllabusVersion: string | null,
  examType: string
): Question[] {
  return questions.filter(
    (q) => q.exam_type === examType && !isCurrentlyValid(q, syllabusVersion)
  );
}
