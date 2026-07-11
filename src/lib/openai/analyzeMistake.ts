import { callOpenAIJson } from "./callOpenAIJson";
import { getGenerationModel } from "./client";
import { MISTAKE_ANALYSIS_JSON_SCHEMA } from "./jsonSchemas";
import { AnswerHistory } from "@/types/answerHistory";
import { getExamLabel } from "@/lib/csv/examRepository";
import { MistakeAnalysisResponse, MistakeAnalysisResponseSchema } from "@/types/openai";
import { Question } from "@/types/question";
import { getActiveChoiceKeys, getChoiceText } from "@/lib/questionChoices";

export interface AnalyzeMistakeInput {
  question: Question;
  answer: AnswerHistory;
  // 過去の関連問題の回答履歴(セクション4-1で渡す情報の一部)
  relatedAnswerHistory: AnswerHistory[];
}

function buildSystemPrompt(examLabel: string): string {
  return `あなたは${examLabel}の学習支援AIです。
ユーザーの誤答の原因を分析してください。
1問だけの結果でミス原因を断定せず、根拠が弱い場合は可能性として表現してください。
古い問題については、ユーザーが当時のルールを間違えたのか、現在のルールとの差によって誤答したのかを区別してください。
出力形式の注意点:
・recommended_trainingは複数の提案があっても1つの文章にまとめた文字列にすること(配列にしない)
・confidence_scoreは0.0〜1.0の範囲の小数にすること
・outdated_knowledge_influenceは真偽値(true/false)にすること
なお、confidence_level(ユーザーの自信度)がnullの場合は、ユーザーが自信度を未回答であることを意味する。その場合は自信度に基づく分析を行わないこと。`;
}

/**
 * 4-1 ミス原因の分析。
 */
export async function analyzeMistake(
  input: AnalyzeMistakeInput
): Promise<MistakeAnalysisResponse> {
  const { question, answer, relatedAnswerHistory } = input;

  const activeChoiceKeys = getActiveChoiceKeys(question);
  const userPrompt = JSON.stringify({
    question_text: question.question_text,
    choices: Object.fromEntries(
      activeChoiceKeys.map((key) => [key, getChoiceText(question, key)])
    ),
    original_correct_choice: question.original_correct_choice,
    current_correct_choice: question.current_correct_choice,
    original_explanation: question.original_explanation,
    current_explanation: question.current_explanation,
    syllabus_version: question.syllabus_version,
    selected_choice: answer.selected_choice,
    is_correct: answer.is_correct,
    answer_time_seconds: answer.answer_time_seconds,
    confidence_level: answer.confidence_level,
    related_answer_history: relatedAnswerHistory.map((a) => ({
      question_id: a.question_id,
      selected_choice: a.selected_choice,
      is_correct: a.is_correct,
      confidence_level: a.confidence_level,
    })),
  });

  const examLabel = await getExamLabel(question.exam_type);
  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt: buildSystemPrompt(examLabel),
    userPrompt,
    jsonSchema: MISTAKE_ANALYSIS_JSON_SCHEMA,
  });

  return MistakeAnalysisResponseSchema.parse(raw);
}
