import { callOpenAIJson } from "./callOpenAIJson";
import { getValidationModel } from "./client";
import { SET_VALIDATION_JSON_SCHEMA, VALIDATION_JSON_SCHEMA } from "./jsonSchemas";
import { getExamLabel } from "@/lib/csv/examRepository";
import {
  GeneratedQuestionResponse,
  GeneratedQuestionSetResponse,
  SetValidationResponse,
  SetValidationResponseSchema,
  ValidationResponse,
  ValidationResponseSchema,
} from "@/types/openai";
import { Question } from "@/types/question";

export interface ValidateGeneratedQuestionInput {
  generatedQuestion: GeneratedQuestionResponse;
  originalQuestion: Question;
}

function buildSystemPrompt(examLabel: string): string {
  return `あなたは${examLabel}の問題検証AIです。
生成された類題について、以下を厳密に確認してください。
・正解が1つだけか
・問題文だけで正解を判断できるか
・正解と解説が一致しているか
・各選択肢の説明に矛盾がないか
・指定したシラバスの出題範囲内か
・指定した基準日時点で内容が有効か
・廃止済みの法律名・制度・用語を誤って使用していないか
・元問題をコピーしすぎていないか
・曖昧な表現がないか
これらすべてを満たす場合のみ passed を true にし、満たさない項目がある場合は issues に理由を列挙してください(合格時 issues は空配列)。`;
}

/**
 * 4-3 生成した類題のチェック。
 * 類題生成とは別モデル(OPENAI_VALIDATION_MODEL)を使用する。
 */
export async function validateGeneratedQuestion(
  input: ValidateGeneratedQuestionInput
): Promise<ValidationResponse> {
  const { generatedQuestion, originalQuestion } = input;

  const userPrompt = JSON.stringify({
    generated_question: generatedQuestion,
    original_question_text: originalQuestion.question_text,
  });

  const examLabel = await getExamLabel(originalQuestion.exam_type);
  const raw = await callOpenAIJson({
    model: getValidationModel(),
    systemPrompt: buildSystemPrompt(examLabel),
    userPrompt,
    jsonSchema: VALIDATION_JSON_SCHEMA,
  });

  return ValidationResponseSchema.parse(raw);
}

export interface ValidateGeneratedQuestionSetInput {
  generatedQuestionSet: GeneratedQuestionSetResponse;
  originalQuestion: Question;
}

function buildSetSystemPrompt(examLabel: string): string {
  return `あなたは${examLabel}の問題検証AIです。
生成された類題セット(1つの文書を複数の設問が共有する形式)について、以下を厳密に確認してください。
・文書(passage_text)の内容に矛盾がないか
・各設問の正解が1つだけか
・各設問が文書だけで正解を判断できるか
・各設問の正解と解説が一致しているか
・各選択肢の説明に矛盾がないか
・セット内の設問同士が、同じ箇所・同じ情報を重複して問うていないか(異なる読解観点を問うているか)
・指定したシラバスの出題範囲内か
・指定した基準日時点で内容が有効か
・廃止済みの法律名・制度・用語を誤って使用していないか
・元問題をコピーしすぎていないか
・曖昧な表現がないか
これらすべてを満たす場合のみ passed を true にし、満たさない項目がある場合は issues に理由を列挙してください(合格時 issues は空配列)。`;
}

/**
 * 4-3 生成した類題セットのチェック。
 * 類題生成とは別モデル(OPENAI_VALIDATION_MODEL)を使用する。
 */
export async function validateGeneratedQuestionSet(
  input: ValidateGeneratedQuestionSetInput
): Promise<SetValidationResponse> {
  const { generatedQuestionSet, originalQuestion } = input;

  const userPrompt = JSON.stringify({
    generated_question_set: generatedQuestionSet,
    original_question_text: originalQuestion.question_text,
  });

  const examLabel = await getExamLabel(originalQuestion.exam_type);
  const raw = await callOpenAIJson({
    model: getValidationModel(),
    systemPrompt: buildSetSystemPrompt(examLabel),
    userPrompt,
    jsonSchema: SET_VALIDATION_JSON_SCHEMA,
  });

  return SetValidationResponseSchema.parse(raw);
}
