import { callOpenAIJson } from "./callOpenAIJson";
import { getValidationModel } from "./client";
import { LISTENING_SIMILAR_VALIDATION_JSON_SCHEMA } from "./jsonSchemas";
import {
  GeneratedListeningSimilarQuestionResponse,
  ListeningSimilarValidationResponse,
  ListeningSimilarValidationResponseSchema,
} from "@/types/openai";
import { Question } from "@/types/question";

export interface ValidateGeneratedListeningSimilarQuestionInput {
  generatedQuestion: GeneratedListeningSimilarQuestionResponse;
  originalQuestion: Question;
}

const SYSTEM_PROMPT = `あなたはTOEIC Listening Part2(応答問題)の問題検証AIです。
生成された類題について、以下を厳密に確認してください。
・選択肢が3つ(A/B/C)の形式を守っているか(4つ目の選択肢を作っていないか)
・正解が1つだけか
・図や前提知識を必要とせず、音声(question_textと3つの応答)だけで解答できるか
・正解と解説が一致しているか
・各選択肢の説明に矛盾がないか
・元問題と同じ聞き取りポイント(detail_category)を維持しているか
・指定されたdifficultyの水準に合っているか
・元問題をコピーしすぎていないか(単語・固有名詞・数値・場面設定を使い回していないか)
・日本語訳が英文の意味と一致しているか
・script_textがquestion_text・choice_a〜cの内容と完全に一致しているか(日本語や解説が混ざっていないか)
・TOEIC本試験として自然な英語になっているか
・曖昧な表現がないか
これらすべてを満たす場合のみ passed を true にし、満たさない項目がある場合は issues に理由を列挙してください(合格時 issues は空配列)。`;

/**
 * TOEICリスニング Part2類題生成問題のチェック。
 * 生成とは別モデル(OPENAI_VALIDATION_MODEL)を使用する。
 */
export async function validateGeneratedListeningSimilarQuestion(
  input: ValidateGeneratedListeningSimilarQuestionInput
): Promise<ListeningSimilarValidationResponse> {
  const { generatedQuestion, originalQuestion } = input;

  const userPrompt = JSON.stringify({
    generated_question: generatedQuestion,
    original_question_text: originalQuestion.question_text,
    original_detail_category: originalQuestion.detail_category,
    original_difficulty: originalQuestion.difficulty,
  });

  const raw = await callOpenAIJson({
    model: getValidationModel(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: LISTENING_SIMILAR_VALIDATION_JSON_SCHEMA,
  });

  return ListeningSimilarValidationResponseSchema.parse(raw);
}
