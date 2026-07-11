import { z } from "zod";

/**
 * user_exams.csv の1行に対応するドメインモデル。
 * ユーザーが学習対象として登録した試験ごとの状態(現在選択中か、受験予定日、対象シラバス等)を保持する。
 * 1ユーザーが複数の試験を登録できるが、現在選択中(is_current)の試験は常に1つとする。
 */
export const UserExamSchema = z.object({
  user_id: z.string().min(1),
  exam_id: z.string().min(1),
  is_current: z.boolean(),
  // 受験予定日(YYYY-MM-DD)。未設定の場合はnull。
  planned_exam_date: z.string().nullable(),
  // 受験予定日から判定された対象シラバスバージョン。シラバス体系を持たない試験、または未判定の場合はnull。
  target_syllabus_version: z.string().nullable(),
  registered_at: z.string(), // ISO日時
  // この試験で最後に問題に回答した日時。未回答の場合はnull。「最近学習した試験」の判定に使う。
  last_studied_at: z.string().nullable(),
});

export type UserExam = z.infer<typeof UserExamSchema>;
