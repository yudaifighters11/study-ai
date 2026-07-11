import { z } from "zod";
import { CHOICE_KEYS, CONFIDENCE_LEVELS } from "./enums";

/**
 * answer_history.csv の1行に対応するドメインモデル。
 */
export const AnswerHistorySchema = z.object({
  answer_id: z.string().min(1),
  user_id: z.string().min(1),
  question_id: z.string().min(1),
  selected_choice: z.enum(CHOICE_KEYS),
  // 採点に使用した正解(当時/現在いずれか)。lib/syllabus/resolveCorrectAnswer.ts が決定する。
  evaluated_correct_choice: z.enum(CHOICE_KEYS),
  is_correct: z.boolean(),
  answer_time_seconds: z.number().nonnegative(),
  // 自信度は任意入力のため、未回答の場合はnull
  confidence_level: z.enum(CONFIDENCE_LEVELS).nullable(),
  // ユーザー自身が申告するミス理由(任意入力、未入力は空文字)
  self_reported_mistake_reason: z.string(),
  syllabus_version: z.string().min(1),
  // どちらの正解基準で評価したかを判定した日時(ISO)
  evaluation_date: z.string(),
  answered_at: z.string(), // ISO日時
});

export type AnswerHistory = z.infer<typeof AnswerHistorySchema>;
