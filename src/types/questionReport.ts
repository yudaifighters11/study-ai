import { z } from "zod";
import { REPORT_REASONS } from "./enums";

/**
 * question_reports.csv の1行に対応するドメインモデル。
 * セクション7-4「問題内容を報告するボタン」から作成される。
 */
export const QuestionReportSchema = z.object({
  report_id: z.string().min(1),
  user_id: z.string().min(1),
  question_id: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  // 自由記述のコメント(任意入力、未入力は空文字)
  comment: z.string(),
  created_at: z.string(), // ISO日時
});

export type QuestionReport = z.infer<typeof QuestionReportSchema>;
