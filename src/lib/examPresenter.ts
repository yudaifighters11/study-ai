import { Exam } from "@/types/exam";
import { MonthlyStudyGoalType, UserExam } from "@/types/userExam";

/**
 * ユーザーが学習対象として登録した試験を、画面表示用にExamカタログ情報とUserExamの状態を合成した形にする。
 */
export interface RegisteredExam {
  exam_id: string;
  name: string;
  category: string;
  is_current: boolean;
  planned_exam_date: string | null;
  target_syllabus_version: string | null;
  // その試験がシラバスバージョン体系を持つか(syllabus_versions.csvに行があるか)。
  // falseの場合、target_syllabus_versionは常にnullのままでよく、受験予定日がなくても出題可能とする。
  has_syllabus: boolean;
  last_studied_at: string | null;
  monthly_study_goal_value: number | null;
  monthly_study_goal_type: MonthlyStudyGoalType | null;
  // 目標スコアまたは目標点。未設定の場合はnull。
  target_score: number | null;
}

export function toRegisteredExam(
  userExam: UserExam,
  exam: Exam | null,
  hasSyllabus: boolean
): RegisteredExam {
  return {
    exam_id: userExam.exam_id,
    name: exam?.name ?? userExam.exam_id,
    category: exam?.category ?? "その他",
    is_current: userExam.is_current,
    planned_exam_date: userExam.planned_exam_date,
    target_syllabus_version: userExam.target_syllabus_version,
    has_syllabus: hasSyllabus,
    last_studied_at: userExam.last_studied_at,
    monthly_study_goal_value: userExam.monthly_study_goal_value,
    monthly_study_goal_type: userExam.monthly_study_goal_type,
    target_score: userExam.target_score,
  };
}
