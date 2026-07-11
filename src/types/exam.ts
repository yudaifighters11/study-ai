import { z } from "zod";

/**
 * exams.csv の1行に対応するドメインモデル。
 * 学習対象となりうる全試験のマスタ(カタログ)。10種類以上に増やす場合はこのCSVに行を追加するだけでよい。
 */
export const ExamSchema = z.object({
  exam_id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  display_order: z.number().int(),
  created_at: z.string(), // ISO日時
});

export type Exam = z.infer<typeof ExamSchema>;
