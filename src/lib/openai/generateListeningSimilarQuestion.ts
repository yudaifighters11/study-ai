import { readFile } from "fs/promises";
import path from "path";
import { callOpenAIJson } from "./callOpenAIJson";
import { getGenerationModel } from "./client";
import { GENERATED_LISTENING_SIMILAR_QUESTION_JSON_SCHEMA } from "./jsonSchemas";
import {
  GeneratedListeningSimilarQuestionResponse,
  GeneratedListeningSimilarQuestionResponseSchema,
  MistakeAnalysisResponse,
} from "@/types/openai";
import { Question } from "@/types/question";
import { ChoiceKey } from "@/types/enums";

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

export interface PreviousListeningSimilarQuestion {
  question_text: string;
}

export interface GenerateListeningSimilarQuestionInput {
  originalQuestion: Question;
  mistakeAnalysis: MistakeAnalysisResponse;
  userSelectedChoice: ChoiceKey;
  previousSimilarQuestions: PreviousListeningSimilarQuestion[];
  previousIssues?: string[];
}

/**
 * TOEICリスニング Part2の類題生成(ユーザーが間違えた原因を踏まえた生成)。
 * data/prompts/toeic_listening_part2.txt(ユーザー作成のプロンプト)を使用する。
 * 大中小分類・詳細分類・difficultyは元問題からそのまま引き継ぎ、AIには出力させない。
 */
export async function generateListeningSimilarQuestion(
  input: GenerateListeningSimilarQuestionInput
): Promise<GeneratedListeningSimilarQuestionResponse> {
  const {
    originalQuestion,
    mistakeAnalysis,
    userSelectedChoice,
    previousSimilarQuestions,
    previousIssues,
  } = input;

  const systemPrompt = await readSystemPrompt();
  const userPrompt = JSON.stringify({
    original_question: {
      question_text: originalQuestion.question_text,
      choice_a: originalQuestion.choice_a,
      choice_b: originalQuestion.choice_b,
      choice_c: originalQuestion.choice_c,
      correct_choice: originalQuestion.current_correct_choice,
      correct_explanation: originalQuestion.current_explanation,
      choice_a_explanation: originalQuestion.choice_a_explanation,
      choice_b_explanation: originalQuestion.choice_b_explanation,
      choice_c_explanation: originalQuestion.choice_c_explanation,
      detail_category: originalQuestion.detail_category,
      difficulty: originalQuestion.difficulty,
    },
    user_selected_choice: userSelectedChoice,
    mistake_type: mistakeAnalysis.mistake_type,
    confused_concepts: mistakeAnalysis.confused_concepts,
    previous_similar_questions: previousSimilarQuestions,
    previous_validation_issues: previousIssues ?? [],
  });

  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt,
    userPrompt,
    jsonSchema: GENERATED_LISTENING_SIMILAR_QUESTION_JSON_SCHEMA,
  });

  return GeneratedListeningSimilarQuestionResponseSchema.parse(raw);
}
