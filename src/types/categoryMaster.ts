import { z } from "zod";

/**
 * category_master.csv の1行に対応するドメインモデル。
 * 試験ごとに正式な大分類・中分類・小分類・詳細分類の組み合わせを管理する。
 * AI類題生成時は detail_category のみをこの一覧から選ばせ、他の階層はここから逆引きする。
 */
export const CategoryMasterSchema = z.object({
  exam_id: z.string().min(1),
  major_category: z.string().min(1),
  middle_category: z.string().min(1),
  minor_category: z.string().min(1),
  detail_category: z.string().min(1),
  // 類題生成の内容プロンプトファイル(data/prompts/配下)。空欄の場合はdefault.txtを使う。
  prompt_file: z.string().nullable(),
  // 1つの文書を複数の設問が共有する形式(TOEIC Part7等)で類題生成する場合の設問数。
  // 空欄の場合は単独の設問(1問)として生成する。
  question_set_size: z.number().int().positive().nullable(),
  created_at: z.string(), // ISO日時
  updated_at: z.string(), // ISO日時
});

export type CategoryMaster = z.infer<typeof CategoryMasterSchema>;
