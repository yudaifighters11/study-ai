import { readFile } from "fs/promises";
import path from "path";
import { callOpenAIJson } from "./callOpenAIJson";
import { getGenerationModel } from "./client";
import { buildGeneratedListeningQuestionJsonSchema } from "./jsonSchemas";
import {
  GeneratedListeningQuestionResponse,
  GeneratedListeningQuestionResponseSchema,
} from "@/types/openai";
import { Part2Topic } from "@/lib/listening/part2Topics";

const PROMPT_PATH = path.join(
  process.cwd(),
  "data",
  "prompts",
  "toeic_listening_part2.txt"
);

async function readSystemPrompt(): Promise<string> {
  try {
    return (await readFile(PROMPT_PATH, "utf-8")).trim();
  } catch {
    throw new Error(
      "プロンプト設定ファイル(data/prompts/toeic_listening_part2.txt)が見つかりません。"
    );
  }
}

export interface PreviousListeningQuestion {
  question_text: string;
}

export interface GenerateListeningQuestionInput {
  topic: Part2Topic;
  // 同じtopicで既に生成済みの問題(場面設定の重複を避けるため)
  previousQuestions: PreviousListeningQuestion[];
  // 前回の生成が検証で不合格だった場合の指摘事項(再生成時に渡す)
  previousIssues?: string[];
}

/**
 * TOEICリスニング Part2(応答問題)の新規生成。
 * 類題生成(4-2, generateSimilarQuestion)と異なり、誤答済みの元問題を前提にしない
 * (実際の過去問音声は著作権上使用できないため、指定したtopicから直接作成する)。
 */
export async function generateListeningQuestion(
  input: GenerateListeningQuestionInput
): Promise<GeneratedListeningQuestionResponse> {
  const { topic, previousQuestions, previousIssues } = input;

  const systemPrompt = await readSystemPrompt();
  const userPrompt = JSON.stringify({
    topic,
    previous_questions: previousQuestions,
    previous_validation_issues: previousIssues ?? [],
  });

  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt,
    userPrompt,
    jsonSchema: buildGeneratedListeningQuestionJsonSchema(),
  });

  return GeneratedListeningQuestionResponseSchema.parse(raw);
}
