import { z } from "zod";

/**
 * users.csv の1行に対応するドメインモデル。
 * 本格的なログイン機能は初期スコープ外のため、固定ユーザーID(FIXED_USER_ID)で運用する。
 * 学習対象の試験・受験予定日・対象シラバスは、複数試験に対応するため user_exams.csv (UserExam) 側で管理する。
 */
export const UserSchema = z.object({
  user_id: z.string().min(1),
  display_name: z.string().min(1),
  email: z.string().email().nullable(),
  created_at: z.string(), // ISO日時
});

export type User = z.infer<typeof UserSchema>;
