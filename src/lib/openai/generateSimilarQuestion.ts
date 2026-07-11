import { format } from "date-fns";
import { callOpenAIJson } from "./callOpenAIJson";
import { getGenerationModel } from "./client";
import { buildGeneratedQuestionJsonSchema, buildGeneratedQuestionSetJsonSchema } from "./jsonSchemas";
import { ChoiceKey } from "@/types/enums";
import {
  buildGeneratedQuestionSetResponseSchema,
  GeneratedQuestionResponse,
  GeneratedQuestionResponseSchema,
  GeneratedQuestionSetResponse,
  MistakeAnalysisResponse,
} from "@/types/openai";
import { Question } from "@/types/question";
import { getActiveChoiceKeys, getChoiceExplanation, getChoiceText } from "@/lib/questionChoices";
import { getExamGenerationContentPrompt } from "./examPromptProfiles";
import { getCategoryMastersByExam } from "@/lib/csv/categoryMasterRepository";
import { getExamLabel } from "@/lib/csv/examRepository";

export interface PreviousSimilarQuestion {
  question_text: string;
  diff_from_original: string;
}

export interface GenerateSimilarQuestionInput {
  originalQuestion: Question;
  mistakeAnalysis: MistakeAnalysisResponse;
  // 対象シラバスバージョン。シラバス体系を持たない試験(TOEIC等)では"N/A"を渡す。
  targetSyllabusVersion: string;
  // ユーザーが実際に選んだ(誤った)選択肢
  userSelectedChoice: ChoiceKey;
  // 同じ元問題からこれまでに生成した類題(重複した切り口を避けるため)
  previousSimilarQuestions: PreviousSimilarQuestion[];
  // 前回の生成が検証で不合格だった場合の指摘事項(再生成時に渡す)
  previousIssues?: string[];
}

function buildSystemPrompt(examLabel: string, contentPrompt: string): string {
  return `あなたは${examLabel}の類題作成AIです。
${contentPrompt}
元問題の選択肢・正解・解説、およびユーザーが実際に選んだ誤答選択肢を踏まえ、
ユーザーが「なぜ間違えたのか」に直接対応する類題を作成してください。
previous_similar_questionsに過去に生成した類題がある場合は、それらと問い方・切り口が重複しないようにしてください。
出力形式の注意点:
・difficultyは1〜5の整数にすること
・related_termsは文字列の配列にすること
・rule_reference_dateはYYYY-MM-DD形式の文字列にすること
・選択肢はchoice_a〜choice_hの8つの枠があるが、target_choice_countで指定された数だけをchoice_aから順に埋め、残りは選択肢本文・解説とも必ずnullにすること(例: target_choice_countが4ならchoice_a〜choice_dのみ埋め、choice_e〜choice_hはnull)
・元問題と同じ選択肢数(target_choice_count)で作成すること
・detail_categoryは、available_detail_categoriesに含まれる候補の中から、類題の内容に最も近いものを1つ選ぶこと(大分類・中分類・小分類はこのdetail_categoryから自動的に決定されるため、出力不要)`;
}

/**
 * 4-2 類題生成。
 */
export async function generateSimilarQuestion(
  input: GenerateSimilarQuestionInput
): Promise<GeneratedQuestionResponse> {
  const {
    originalQuestion,
    mistakeAnalysis,
    targetSyllabusVersion,
    userSelectedChoice,
    previousSimilarQuestions,
    previousIssues,
  } = input;
  const ruleReferenceDate = format(new Date(), "yyyy-MM-dd");
  const activeChoiceKeys = getActiveChoiceKeys(originalQuestion);
  const targetChoiceCount = activeChoiceKeys.length;
  const contentPrompt = await getExamGenerationContentPrompt(
    originalQuestion.exam_type,
    originalQuestion.detail_category
  );

  const categoryMasters = await getCategoryMastersByExam(originalQuestion.exam_type);
  const detailCategories = categoryMasters.map((c) => c.detail_category);
  if (detailCategories.length === 0) {
    throw new Error(
      `この試験(${originalQuestion.exam_type})の分類マスタ(category_master.csv)が未整備のため、類題を生成できません。`
    );
  }

  const userPrompt = JSON.stringify({
    original_question: {
      question_text: originalQuestion.question_text,
      major_category: originalQuestion.major_category,
      middle_category: originalQuestion.middle_category,
      minor_category: originalQuestion.minor_category,
      detail_category: originalQuestion.detail_category,
      related_terms: originalQuestion.related_terms,
      difficulty: originalQuestion.difficulty,
      choices: Object.fromEntries(
        activeChoiceKeys.map((key) => [key, getChoiceText(originalQuestion, key)])
      ),
      correct_choice: originalQuestion.current_correct_choice,
      correct_explanation: originalQuestion.current_explanation,
      choice_explanations: Object.fromEntries(
        activeChoiceKeys.map((key) => [
          key,
          getChoiceExplanation(originalQuestion, key),
        ])
      ),
    },
    user_selected_choice: userSelectedChoice,
    target_choice_count: targetChoiceCount,
    mistake_type: mistakeAnalysis.mistake_type,
    confused_concepts: mistakeAnalysis.confused_concepts,
    target_syllabus_version: targetSyllabusVersion,
    rule_reference_date: ruleReferenceDate,
    previous_similar_questions: previousSimilarQuestions,
    previous_validation_issues: previousIssues ?? [],
    available_detail_categories: detailCategories,
  });

  const examLabel = await getExamLabel(originalQuestion.exam_type);
  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt: buildSystemPrompt(examLabel, contentPrompt),
    userPrompt,
    jsonSchema: buildGeneratedQuestionJsonSchema(detailCategories),
  });

  return GeneratedQuestionResponseSchema.parse(raw);
}

export interface GenerateSimilarQuestionSetInput {
  originalQuestion: Question;
  mistakeAnalysis: MistakeAnalysisResponse;
  // 対象シラバスバージョン。シラバス体系を持たない試験(TOEIC等)では"N/A"を渡す。
  targetSyllabusVersion: string;
  userSelectedChoice: ChoiceKey;
  previousSimilarQuestions: PreviousSimilarQuestion[];
  previousIssues?: string[];
  // 1つの文書を共有する設問の数(category_master.csvのquestion_set_sizeから決定)
  questionCount: number;
}

function buildSetSystemPrompt(
  examLabel: string,
  contentPrompt: string,
  questionCount: number
): string {
  return `あなたは${examLabel}の類題作成AIです。
${contentPrompt}
元問題の選択肢・正解・解説、およびユーザーが実際に選んだ誤答選択肢を踏まえ、
ユーザーが「なぜ間違えたのか」に直接対応する類題セットを作成してください。
previous_similar_questionsに過去に生成した類題がある場合は、それらと問い方・切り口が重複しないようにしてください。
出力形式の注意点:
・questionsは必ずちょうどtarget_question_count(${questionCount})件の配列にすること。多くても少なくてもいけない
・difficultyは1〜5の整数にし、セット全体で1つの値にすること
・target_mistake_typeとdiff_from_original、syllabus_version、rule_reference_dateもセット全体で1つの値にすること
・各設問のrelated_termsは文字列の配列にすること
・rule_reference_dateはYYYY-MM-DD形式の文字列にすること
・選択肢はchoice_a〜choice_hの8つの枠があるが、target_choice_countで指定された数だけをchoice_aから順に埋め、残りは選択肢本文・解説とも必ずnullにすること(例: target_choice_countが4ならchoice_a〜choice_dのみ埋め、choice_e〜choice_hはnull)
・元問題と同じ選択肢数(target_choice_count)で作成すること
・各設問のdetail_categoryは、available_detail_categoriesに含まれる候補の中から、その設問の内容に最も近いものをそれぞれ選ぶこと(大分類・中分類・小分類はこのdetail_categoryから自動的に決定されるため、出力不要)`;
}

/**
 * 4-2 類題生成(複数設問セット)。TOEIC Part7等、1つの文書を複数の設問が共有する場合に使用する。
 */
export async function generateSimilarQuestionSet(
  input: GenerateSimilarQuestionSetInput
): Promise<GeneratedQuestionSetResponse> {
  const {
    originalQuestion,
    mistakeAnalysis,
    targetSyllabusVersion,
    userSelectedChoice,
    previousSimilarQuestions,
    previousIssues,
    questionCount,
  } = input;
  const ruleReferenceDate = format(new Date(), "yyyy-MM-dd");
  const activeChoiceKeys = getActiveChoiceKeys(originalQuestion);
  const targetChoiceCount = activeChoiceKeys.length;
  const contentPrompt = await getExamGenerationContentPrompt(
    originalQuestion.exam_type,
    originalQuestion.detail_category
  );

  const categoryMasters = await getCategoryMastersByExam(originalQuestion.exam_type);
  const detailCategories = categoryMasters.map((c) => c.detail_category);
  if (detailCategories.length === 0) {
    throw new Error(
      `この試験(${originalQuestion.exam_type})の分類マスタ(category_master.csv)が未整備のため、類題を生成できません。`
    );
  }

  const userPrompt = JSON.stringify({
    original_question: {
      question_text: originalQuestion.question_text,
      major_category: originalQuestion.major_category,
      middle_category: originalQuestion.middle_category,
      minor_category: originalQuestion.minor_category,
      detail_category: originalQuestion.detail_category,
      related_terms: originalQuestion.related_terms,
      difficulty: originalQuestion.difficulty,
      choices: Object.fromEntries(
        activeChoiceKeys.map((key) => [key, getChoiceText(originalQuestion, key)])
      ),
      correct_choice: originalQuestion.current_correct_choice,
      correct_explanation: originalQuestion.current_explanation,
      choice_explanations: Object.fromEntries(
        activeChoiceKeys.map((key) => [
          key,
          getChoiceExplanation(originalQuestion, key),
        ])
      ),
    },
    user_selected_choice: userSelectedChoice,
    target_choice_count: targetChoiceCount,
    target_question_count: questionCount,
    mistake_type: mistakeAnalysis.mistake_type,
    confused_concepts: mistakeAnalysis.confused_concepts,
    target_syllabus_version: targetSyllabusVersion,
    rule_reference_date: ruleReferenceDate,
    previous_similar_questions: previousSimilarQuestions,
    previous_validation_issues: previousIssues ?? [],
    available_detail_categories: detailCategories,
  });

  const examLabel = await getExamLabel(originalQuestion.exam_type);
  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt: buildSetSystemPrompt(examLabel, contentPrompt, questionCount),
    userPrompt,
    jsonSchema: buildGeneratedQuestionSetJsonSchema(detailCategories, questionCount),
  });

  return buildGeneratedQuestionSetResponseSchema(questionCount).parse(raw);
}
