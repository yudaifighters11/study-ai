import { callOpenAIJson } from "./callOpenAIJson";
import { getValidationModel } from "./client";
import { LISTENING_VALIDATION_JSON_SCHEMA } from "./jsonSchemas";
import {
  GeneratedListeningQuestionResponse,
  ListeningValidationResponse,
  ListeningValidationResponseSchema,
} from "@/types/openai";
import { Part2Topic } from "@/lib/listening/part2Topics";

export interface ValidateGeneratedListeningQuestionInput {
  generatedQuestion: GeneratedListeningQuestionResponse;
  topic: Part2Topic;
}

const SYSTEM_PROMPT = `あなたはTOEIC Listening Part2(応答問題)の問題検証AIです。
生成された問題について、以下を厳密に確認してください。
・選択肢が3つ(A/B/C)の形式を守っているか(4つ目の選択肢を作っていないか)
・正解が1つだけか
・図や前提知識を必要とせず、音声(question_textと3つの応答)だけで解答できるか
・正解と解説が一致しているか
・各選択肢の説明に矛盾がないか
・指定されたtopic(出題タイプ)の内容に合っているか
・TOEIC本試験として自然な英語になっているか
・曖昧な表現がないか
これらすべてを満たす場合のみ passed を true にし、満たさない項目がある場合は issues に理由を列挙してください(合格時 issues は空配列)。`;

/**
 * TOEICリスニング Part2生成問題のチェック(4-3相当)。
 * 生成とは別モデル(OPENAI_VALIDATION_MODEL)を使用する。
 */
export async function validateGeneratedListeningQuestion(
  input: ValidateGeneratedListeningQuestionInput
): Promise<ListeningValidationResponse> {
  const { generatedQuestion, topic } = input;

  const userPrompt = JSON.stringify({
    topic,
    generated_question: generatedQuestion,
  });

  const raw = await callOpenAIJson({
    model: getValidationModel(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: LISTENING_VALIDATION_JSON_SCHEMA,
  });

  return ListeningValidationResponseSchema.parse(raw);
}
