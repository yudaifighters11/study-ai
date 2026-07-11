import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getFixedUserId } from "@/lib/config";
import { CHOICE_KEYS, CONFIDENCE_LEVELS } from "@/types/enums";
import { getQuestionById } from "@/lib/csv/questionRepository";
import {
  getAnswerHistoryByUser,
  insertAnswerHistory,
} from "@/lib/csv/answerHistoryRepository";
import { insertMistakeAnalysis } from "@/lib/csv/mistakeAnalysisRepository";
import { touchLastStudied } from "@/lib/csv/userExamRepository";
import { resolveEvaluationChoice, hasCorrectAnswerChanged } from "@/lib/syllabus/resolveCorrectAnswer";
import { analyzeMistake } from "@/lib/openai/analyzeMistake";
import { toErrorResponse } from "@/lib/apiErrorHandler";
import { getActiveChoiceKeys } from "@/lib/questionChoices";

const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedChoice: z.enum(CHOICE_KEYS),
  answerTimeSeconds: z.number().nonnegative(),
  // 自信度は任意入力(選択しなくてもよい)
  confidenceLevel: z.enum(CONFIDENCE_LEVELS).nullable(),
  // "historical"の場合、出題当時のルール(original_correct_choice)で採点する(過去の問題を見るモード)
  mode: z.enum(["current", "historical"]).optional().default("current"),
});

export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function handlePost(request: NextRequest) {
  const body = await request.json();
  const parsed = SubmitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { questionId, selectedChoice, answerTimeSeconds, confidenceLevel, mode } =
    parsed.data;

  const question = await getQuestionById(questionId);
  if (!question) {
    return NextResponse.json(
      { error: "問題が見つかりません" },
      { status: 404 }
    );
  }

  if (!getActiveChoiceKeys(question).includes(selectedChoice)) {
    return NextResponse.json(
      { error: "この問題に存在しない選択肢が指定されました" },
      { status: 400 }
    );
  }

  const userId = getFixedUserId();
  const now = new Date().toISOString();

  // 正誤判定は通常のプログラムで行う(セクション5、AIには行わせない)
  // 「過去の問題を見る」モードでは、出題当時のルール(original_correct_choice)で採点する
  const evaluatedCorrectChoice = resolveEvaluationChoice(
    question,
    mode === "historical" ? "original_rule" : "current_rule"
  );
  const isCorrect = selectedChoice === evaluatedCorrectChoice;

  const answerId = uuidv4();
  await insertAnswerHistory({
    answer_id: answerId,
    user_id: userId,
    question_id: questionId,
    selected_choice: selectedChoice,
    evaluated_correct_choice: evaluatedCorrectChoice,
    is_correct: isCorrect,
    answer_time_seconds: answerTimeSeconds,
    confidence_level: confidenceLevel,
    self_reported_mistake_reason: "",
    syllabus_version: question.syllabus_version,
    evaluation_date: now,
    answered_at: now,
  });
  await touchLastStudied(userId, question.exam_type, now);

  let mistakeAnalysis = null;
  let mistakeAnalysisError: string | null = null;

  if (!isCorrect) {
    // 正誤判定・履歴保存(AIを使わない処理)はここまでで完了しているため、
    // AI呼び出しが失敗しても採点結果・解説は正常に返す。失敗理由は別フィールドで伝える。
    try {
      const priorHistory = (await getAnswerHistoryByUser(userId)).filter(
        (a) => a.answer_id !== answerId
      );
      const relatedAnswerHistory = priorHistory.filter((a) => {
        // 同じ問題への過去の回答のみを「関連する回答履歴」として渡す(初期実装の簡易版)
        return a.question_id === questionId;
      });

      const analysisResult = await analyzeMistake({
        question,
        answer: {
          answer_id: answerId,
          user_id: userId,
          question_id: questionId,
          selected_choice: selectedChoice,
          evaluated_correct_choice: evaluatedCorrectChoice,
          is_correct: isCorrect,
          answer_time_seconds: answerTimeSeconds,
          confidence_level: confidenceLevel,
          self_reported_mistake_reason: "",
          syllabus_version: question.syllabus_version,
          evaluation_date: now,
          answered_at: now,
        },
        relatedAnswerHistory,
      });

      const analysisId = uuidv4();
      await insertMistakeAnalysis({
        analysis_id: analysisId,
        user_id: userId,
        answer_id: answerId,
        question_id: questionId,
        mistake_type: analysisResult.mistake_type,
        confused_concepts: analysisResult.confused_concepts,
        analysis_comment: analysisResult.analysis_comment,
        recommended_training: analysisResult.recommended_training,
        confidence_score: analysisResult.confidence_score,
        outdated_knowledge_influence: analysisResult.outdated_knowledge_influence,
        syllabus_version: question.syllabus_version,
        created_at: now,
      });

      mistakeAnalysis = { analysis_id: analysisId, ...analysisResult };
    } catch (error) {
      console.error("analyzeMistake failed:", error);
      mistakeAnalysisError =
        error instanceof Error
          ? error.message
          : "ミス原因分析でエラーが発生しました";
    }
  }

  return NextResponse.json({
    answerId,
    isCorrect,
    evaluatedCorrectChoice,
    originalCorrectChoice: question.original_correct_choice,
    currentCorrectChoice: question.current_correct_choice,
    correctAnswerChanged: hasCorrectAnswerChanged(question),
    explanations: {
      original: question.original_explanation,
      current: question.current_explanation,
      choice_a: question.choice_a_explanation,
      choice_b: question.choice_b_explanation,
      choice_c: question.choice_c_explanation,
      choice_d: question.choice_d_explanation,
      choice_e: question.choice_e_explanation,
      choice_f: question.choice_f_explanation,
      choice_g: question.choice_g_explanation,
      choice_h: question.choice_h_explanation,
    },
    revisionNote: question.revision_note,
    mistakeAnalysis,
    mistakeAnalysisError,
    isHistoricalQuestion: mode === "historical",
    currentExamScope: question.is_current_exam_scope,
    similarQuestionBlocked: question.similar_question_blocked,
  });
}
