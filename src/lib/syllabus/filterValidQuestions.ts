import { Question } from "@/types/question";

// この判定に必要な列だけを持っていればよい(getAllQuestions/getQuestionsForFilteringの両方を受け付ける)。
type FilterableQuestion = Pick<
  Question,
  "exam_type" | "syllabus_version" | "is_current" | "is_current_exam_scope"
>;

/**
 * syllabusVersionがnullの場合は、シラバス体系を持たない試験(TOEIC等)とみなし、
 * シラバスバージョンの一致は問わずis_current/is_current_exam_scopeのみで判定する。
 */
function isCurrentlyValid(
  question: FilterableQuestion,
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
export function filterValidQuestions<T extends FilterableQuestion>(
  questions: T[],
  syllabusVersion: string | null,
  examType: string
): T[] {
  return questions.filter(
    (q) => q.exam_type === examType && isCurrentlyValid(q, syllabusVersion)
  );
}

/**
 * 「過去の問題を見る」モード用: 現行の出題対象ではない問題(旧シラバス・出題対象外・無効化済み)を抽出する。
 * セクション6-2の手順5(古い問題を出題する場合の扱い)に対応。
 */
export function filterHistoricalQuestions<T extends FilterableQuestion>(
  questions: T[],
  syllabusVersion: string | null,
  examType: string
): T[] {
  return questions.filter(
    (q) => q.exam_type === examType && !isCurrentlyValid(q, syllabusVersion)
  );
}
