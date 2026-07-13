import { z } from "zod";

// サインアップ時の任意項目「年代」の選択肢。
export const AgeGroupSchema = z.enum(["10s", "20s", "30s", "40s", "50s_plus"]);
export type AgeGroup = z.infer<typeof AgeGroupSchema>;

// サインアップ時の任意項目「身分」の選択肢。
export const OccupationSchema = z.enum([
  "junior_high",
  "high_school",
  "university",
  "working_adult",
  "other",
]);
export type Occupation = z.infer<typeof OccupationSchema>;

/**
 * users.csv の1行に対応するドメインモデル。
 * 学習対象の試験・受験予定日・目標スコア・対象シラバスは、複数試験に対応するため user_exams.csv (UserExam) 側で管理する。
 * terms_agreed_at は利用規約・プライバシーポリシーへの同意日時(サインアップ時必須)。
 * 移行前に作成された既存ユーザーには記録がないため null を許容する。
 */
export const UserSchema = z.object({
  user_id: z.string().min(1),
  display_name: z.string().min(1),
  email: z.string().email().nullable(),
  age_group: AgeGroupSchema.nullable(),
  occupation: OccupationSchema.nullable(),
  terms_agreed_at: z.string().nullable(), // ISO日時
  // マイページの「通知・リマインド」トグルに対応。ホーム画面のバナー表示可否を切り替える。
  review_reminder_enabled: z.boolean(),
  study_reminder_enabled: z.boolean(),
  // 復習リマインド: 不正解のまま何日経過したら「復習が必要」とみなすか
  review_reminder_threshold_days: z.number().int().min(1),
  // 学習リマインド: 最終学習日から何日経過したら表示するか
  study_inactivity_threshold_days: z.number().int().min(1),
  // 学習リマインド: 受験予定日まで何日以内なら表示するか
  exam_proximity_threshold_days: z.number().int().min(1),
  // リスニング問題(TOEIC Part2等)で、問題文(ナレーターの質問・発言)を表示するか
  listening_show_question_text: z.boolean(),
  // リスニング問題で、問の文(3つの応答選択肢の文)を表示するか
  listening_show_choice_text: z.boolean(),
  created_at: z.string(), // ISO日時
});

export type User = z.infer<typeof UserSchema>;
