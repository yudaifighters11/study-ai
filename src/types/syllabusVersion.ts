import { z } from "zod";

/**
 * syllabus_versions.csv の1行に対応するドメインモデル。
 */
export const SyllabusVersionSchema = z.object({
  // どの試験のシラバスか(試験ごとにシラバスバージョンの体系が異なるため)。exams.csvに登録されている試験ID。
  exam_type: z.string().min(1),
  syllabus_version: z.string().min(1),
  valid_from: z.string(), // YYYY-MM-DD
  valid_until: z.string().nullable(), // YYYY-MM-DD、現行バージョンはnull
  is_current: z.boolean(),
  description: z.string(),
  change_summary: z.string(),
  created_at: z.string(), // ISO日時
  updated_at: z.string(), // ISO日時
});

export type SyllabusVersion = z.infer<typeof SyllabusVersionSchema>;
