import { z } from "zod";
import { MISTAKE_TYPES } from "./enums";

/**
 * mistake_analyses.csv の1行に対応するドメインモデル。
 * OpenAI API(4-1 ミス原因の分析)の結果を保存する。
 */
export const MistakeAnalysisSchema = z.object({
  analysis_id: z.string().min(1),
  user_id: z.string().min(1),
  answer_id: z.string().min(1),
  question_id: z.string().min(1),
  mistake_type: z.enum(MISTAKE_TYPES),
  // 混同している可能性がある用語・概念(複数可)
  confused_concepts: z.array(z.string()),
  analysis_comment: z.string().min(1),
  recommended_training: z.string().min(1),
  // 分析の確信度(0.0〜1.0)。1問だけで断定しないための指標。
  confidence_score: z.number().min(0).max(1),
  // 古い知識・制度変更が誤答に影響したかどうか
  outdated_knowledge_influence: z.boolean(),
  syllabus_version: z.string().min(1),
  created_at: z.string(), // ISO日時
});

export type MistakeAnalysis = z.infer<typeof MistakeAnalysisSchema>;
