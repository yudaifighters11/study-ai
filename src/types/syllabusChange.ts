import { z } from "zod";
import { SYLLABUS_CHANGE_STATUSES, SYLLABUS_CHANGE_TYPES } from "./enums";

/**
 * syllabus_changes.csv の1行に対応するドメインモデル。
 * 1回のシラバス改定で複数の変更点がある場合、1件ずつ行として記録する。
 * これ自体は過去問データを自動で書き換えるものではなく、
 * 「どの変更点について、影響を受ける過去問の確認・反映が済んでいるか」を追跡するための一覧。
 */
export const SyllabusChangeSchema = z.object({
  change_id: z.string().min(1),
  exam_type: z.string().min(1),
  // この変更が導入されたシラバスバージョン
  syllabus_version: z.string().min(1),
  change_type: z.enum(SYLLABUS_CHANGE_TYPES),
  description: z.string().min(1),
  // 用語変更の場合の旧名称・新名称(該当しない場合はnull)
  old_term: z.string().nullable(),
  new_term: z.string().nullable(),
  // 影響を受けそうな論点のヒント(過去問を探す手がかり、任意)
  affected_topic: z.string().nullable(),
  // 変更が適用される基準日(YYYY-MM-DD)
  effective_date: z.string(),
  status: z.enum(SYLLABUS_CHANGE_STATUSES),
  // 確認の結果、実際に影響があり更新した過去問のID一覧(未確認・対象なしの場合は空配列)
  affected_question_ids: z.array(z.string()),
  created_at: z.string(), // ISO日時
  updated_at: z.string(), // ISO日時
});

export type SyllabusChange = z.infer<typeof SyllabusChangeSchema>;
