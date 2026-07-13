import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  getAnswerHistoryById,
  getAnswerHistoryByUser,
} from "@/lib/csv/answerHistoryRepository";
import { getMistakeAnalysisByAnswerId } from "@/lib/csv/mistakeAnalysisRepository";
import { getAllQuestions, getQuestionById, insertQuestion, updateQuestion } from "@/lib/csv/questionRepository";
import { getAllSyllabusVersions } from "@/lib/csv/syllabusRepository";
import { findCategoryByDetail, resolveQuestionSetSize } from "@/lib/csv/categoryMasterRepository";
import {
  generateSimilarQuestion,
  generateSimilarQuestionSet,
  PreviousSimilarQuestion,
} from "@/lib/openai/generateSimilarQuestion";
import {
  validateGeneratedQuestion,
  validateGeneratedQuestionSet,
} from "@/lib/openai/validateGeneratedQuestion";
import { toPublicQuestion } from "@/lib/questionPresenter";
import { Question } from "@/types/question";
import { MistakeAnalysisResponse } from "@/types/openai";
import { ChoiceKey } from "@/types/enums";
import { toErrorResponse } from "@/lib/apiErrorHandler";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";

const RequestSchema = z.object({
  answerId: z.string().min(1),
});

// 4-3 検証不合格時の再生成上限(セクション4-3、11で確定済み)
const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function handlePost(request: NextRequest) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力値が不正です", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answerId } = parsed.data;

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const answer = await getAnswerHistoryById(answerId);
  if (!answer || answer.user_id !== userId) {
    return NextResponse.json(
      { error: "回答履歴が見つかりません" },
      { status: 404 }
    );
  }

  const mistakeAnalysis = await getMistakeAnalysisByAnswerId(answerId);
  if (!mistakeAnalysis) {
    return NextResponse.json(
      {
        error:
          "この回答に対するミス分析が見つかりません。不正解だった回答にのみ類題を生成できます。",
      },
      { status: 400 }
    );
  }

  const originalQuestion = await getQuestionById(answer.question_id);
  if (!originalQuestion) {
    return NextResponse.json(
      { error: "元の問題が見つかりません" },
      { status: 404 }
    );
  }

  if (originalQuestion.similar_question_blocked) {
    return NextResponse.json(
      {
        error:
          "この問題は過去に類題の生成・検証が3回とも失敗したため、現在は類題生成を停止しています。",
      },
      { status: 400 }
    );
  }

  // シラバス体系を持つ試験は現行シラバスが必須。シラバス体系を持たない試験(TOEIC等)は"N/A"を使う。
  const syllabusVersions = await getAllSyllabusVersions();
  const hasSyllabusSystem = syllabusVersions.some(
    (sv) => sv.exam_type === originalQuestion.exam_type
  );
  let targetSyllabusVersion: string;
  if (hasSyllabusSystem) {
    const currentSyllabus = syllabusVersions.find(
      (sv) => sv.exam_type === originalQuestion.exam_type && sv.is_current
    );
    if (!currentSyllabus) {
      return NextResponse.json(
        { error: "現行シラバスが見つかりません" },
        { status: 500 }
      );
    }
    targetSyllabusVersion = currentSyllabus.syllabus_version;
  } else {
    targetSyllabusVersion = "N/A";
  }

  const mistakeAnalysisForPrompt = {
    mistake_type: mistakeAnalysis.mistake_type,
    confused_concepts: mistakeAnalysis.confused_concepts,
    analysis_comment: mistakeAnalysis.analysis_comment,
    recommended_training: mistakeAnalysis.recommended_training,
    confidence_score: mistakeAnalysis.confidence_score,
    outdated_knowledge_influence: mistakeAnalysis.outdated_knowledge_influence,
  };

  // 同じ元問題からこれまでに生成した類題(重複した切り口を避けるため、新規生成時のプロンプトに使う)
  const allQuestions = await getAllQuestions(originalQuestion.exam_type);
  const existingVariants = allQuestions.filter(
    (q) =>
      q.question_type === "ai_generated" &&
      q.original_question_id === originalQuestion.question_id
  );
  const previousSimilarQuestions = existingVariants.map((q) => ({
    question_text: q.question_text,
    diff_from_original: q.revision_note,
  }));

  // 既存の類題を再利用できないか確認する(案B: 復習目的で正解済みの類題の再出題も許容する)。
  // 対象は現在も有効な類題のみとし、シラバス変更等で古くなった類題は再利用しない。
  // 複数設問セット(passage_group_id あり)の場合は、必ずセットの最初の設問(passage_order === 1)から再開する。
  const reusableCandidates = existingVariants.filter(
    (q) =>
      q.is_current &&
      q.is_current_exam_scope &&
      (q.passage_group_id === null || q.passage_order === 1)
  );
  const userAnswers = await getAnswerHistoryByUser(answer.user_id);
  const latestAnswerFor = (questionId: string) => {
    const answers = userAnswers.filter((a) => a.question_id === questionId);
    if (answers.length === 0) return null;
    return answers.reduce((latest, a) =>
      a.answered_at > latest.answered_at ? a : latest
    );
  };
  // 優先順位: ①直近の回答が不正解のまま ②未回答 ③どちらもなければ新規生成(下のループへ)
  const stillIncorrect = reusableCandidates.find((q) => {
    const latest = latestAnswerFor(q.question_id);
    return latest !== null && !latest.is_correct;
  });
  const unanswered = reusableCandidates.find(
    (q) => latestAnswerFor(q.question_id) === null
  );
  const reusedQuestion = stillIncorrect ?? unanswered ?? null;

  if (reusedQuestion) {
    return NextResponse.json({
      question: toPublicQuestion(reusedQuestion),
      diffFromOriginal: reusedQuestion.revision_note,
      targetMistakeType:
        reusedQuestion.target_mistake_type ?? mistakeAnalysisForPrompt.mistake_type,
      attempts: 0,
    });
  }

  // 1つの文書を複数の設問が共有する形式(TOEIC Part7等)かどうかを、元問題のdetail_categoryから判定する。
  const questionSetSize = await resolveQuestionSetSize(
    originalQuestion.exam_type,
    originalQuestion.detail_category
  );

  if (questionSetSize > 1) {
    return await generateAndInsertQuestionSet({
      originalQuestion,
      mistakeAnalysisForPrompt,
      targetSyllabusVersion,
      userSelectedChoice: answer.selected_choice,
      previousSimilarQuestions,
      questionCount: questionSetSize,
      answerId,
    });
  }

  let previousIssues: string[] | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const generated = await generateSimilarQuestion({
      originalQuestion,
      mistakeAnalysis: mistakeAnalysisForPrompt,
      targetSyllabusVersion,
      userSelectedChoice: answer.selected_choice,
      previousSimilarQuestions,
      previousIssues,
    });

    const validation = await validateGeneratedQuestion({
      generatedQuestion: generated,
      originalQuestion,
    });

    if (validation.passed) {
      const now = new Date().toISOString();
      const category = await findCategoryByDetail(
        originalQuestion.exam_type,
        generated.detail_category
      );
      if (!category) {
        // JSON Schemaのenumで縛っているため通常発生しないが、万一マスタと不整合が起きた場合に検知する。
        throw new Error(
          `AIが選択したdetail_category「${generated.detail_category}」がcategory_master.csvに見つかりません。`
        );
      }
      const question: Question = {
        question_id: uuidv4(),
        exam_type: originalQuestion.exam_type,
        question_type: "ai_generated",
        original_question_id: originalQuestion.question_id,
        question_text: generated.question_text,
        passage_text: null,
        passage_group_id: null,
        passage_order: null,
        passage_total_questions: null,
        choice_a: generated.choice_a,
        choice_b: generated.choice_b,
        choice_c: generated.choice_c,
        choice_d: generated.choice_d,
        choice_e: generated.choice_e,
        choice_f: generated.choice_f,
        choice_g: generated.choice_g,
        choice_h: generated.choice_h,
        original_correct_choice: generated.correct_choice,
        current_correct_choice: generated.correct_choice,
        original_explanation: generated.correct_explanation,
        current_explanation: generated.correct_explanation,
        choice_a_explanation: generated.choice_a_explanation,
        choice_b_explanation: generated.choice_b_explanation,
        choice_c_explanation: generated.choice_c_explanation,
        choice_d_explanation: generated.choice_d_explanation,
        choice_e_explanation: generated.choice_e_explanation,
        choice_f_explanation: generated.choice_f_explanation,
        choice_g_explanation: generated.choice_g_explanation,
        choice_h_explanation: generated.choice_h_explanation,
        major_category: category.major_category,
        middle_category: category.middle_category,
        minor_category: category.minor_category,
        detail_category: category.detail_category,
        related_terms: generated.related_terms,
        difficulty: generated.difficulty,
        target_mistake_type: generated.target_mistake_type,
        source_year: new Date().getFullYear(),
        syllabus_version: generated.syllabus_version,
        valid_from: format(new Date(), "yyyy-MM-dd"),
        valid_until: null,
        is_current: true,
        is_current_exam_scope: true,
        revision_note: generated.diff_from_original,
        validation_status: "passed",
        rule_reference_date: generated.rule_reference_date,
        similar_question_blocked: false,
        audio_url: null,
        script_text: null,
        script_text_ja: null,
        created_at: now,
        updated_at: now,
      };

      await insertQuestion(question);

      return NextResponse.json({
        question: toPublicQuestion(question),
        diffFromOriginal: generated.diff_from_original,
        targetMistakeType: generated.target_mistake_type,
        attempts: attempt,
      });
    }

    console.error(
      `類題生成: 検証不合格(${attempt}回目) answerId=${answerId} issues=`,
      validation.issues
    );
    previousIssues = validation.issues;
  }

  // 検証不合格が上限回数続いた場合、ユーザーへは出題しない(セクション4-3)。
  // 以後この問題からは類題生成を自動で試みないよう、元問題にフラグを立てる。
  // (AIの精度が上がるなどして再挑戦させたい場合は、questions.csvでこの値を手動でfalseに戻す)
  await updateQuestion({
    ...originalQuestion,
    similar_question_blocked: true,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error:
        "類題の生成に失敗しました(検証不合格が3回続いたため出題できません)。この問題は今後、類題生成の対象から除外されました。",
    },
    { status: 422 }
  );
}

/**
 * 1つの文書を複数の設問が共有する形式(TOEIC Part7等)の類題セットを生成・検証し、
 * 検証に通ったセット全体をquestions.csvへ保存する。
 * セット単位で検証・再生成上限(3回)を管理し(セクション4-3)、不合格が続いた場合は元問題をブロックする。
 * クライアントへはセットの最初の設問(passage_order === 1)のみを返し、
 * 残りは/api/questionsのpassageGroupId/passageOrderパラメータ経由で順に取得される。
 */
async function generateAndInsertQuestionSet(params: {
  originalQuestion: Question;
  mistakeAnalysisForPrompt: MistakeAnalysisResponse;
  targetSyllabusVersion: string;
  userSelectedChoice: ChoiceKey;
  previousSimilarQuestions: PreviousSimilarQuestion[];
  questionCount: number;
  answerId: string;
}): Promise<NextResponse> {
  const {
    originalQuestion,
    mistakeAnalysisForPrompt,
    targetSyllabusVersion,
    userSelectedChoice,
    previousSimilarQuestions,
    questionCount,
    answerId,
  } = params;

  let previousIssues: string[] | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const generatedSet = await generateSimilarQuestionSet({
      originalQuestion,
      mistakeAnalysis: mistakeAnalysisForPrompt,
      targetSyllabusVersion,
      userSelectedChoice,
      previousSimilarQuestions,
      previousIssues,
      questionCount,
    });

    const validation = await validateGeneratedQuestionSet({
      generatedQuestionSet: generatedSet,
      originalQuestion,
    });

    if (validation.passed) {
      const now = new Date().toISOString();
      const passageGroupId = uuidv4();

      const questions: Question[] = [];
      for (const [index, item] of generatedSet.questions.entries()) {
        const category = await findCategoryByDetail(
          originalQuestion.exam_type,
          item.detail_category
        );
        if (!category) {
          // JSON Schemaのenumで縛っているため通常発生しないが、万一マスタと不整合が起きた場合に検知する。
          throw new Error(
            `AIが選択したdetail_category「${item.detail_category}」がcategory_master.csvに見つかりません。`
          );
        }
        questions.push({
          question_id: uuidv4(),
          exam_type: originalQuestion.exam_type,
          question_type: "ai_generated",
          original_question_id: originalQuestion.question_id,
          question_text: item.question_text,
          passage_text: generatedSet.passage_text,
          passage_group_id: passageGroupId,
          passage_order: index + 1,
          passage_total_questions: generatedSet.questions.length,
          choice_a: item.choice_a,
          choice_b: item.choice_b,
          choice_c: item.choice_c,
          choice_d: item.choice_d,
          choice_e: item.choice_e,
          choice_f: item.choice_f,
          choice_g: item.choice_g,
          choice_h: item.choice_h,
          original_correct_choice: item.correct_choice,
          current_correct_choice: item.correct_choice,
          original_explanation: item.correct_explanation,
          current_explanation: item.correct_explanation,
          choice_a_explanation: item.choice_a_explanation,
          choice_b_explanation: item.choice_b_explanation,
          choice_c_explanation: item.choice_c_explanation,
          choice_d_explanation: item.choice_d_explanation,
          choice_e_explanation: item.choice_e_explanation,
          choice_f_explanation: item.choice_f_explanation,
          choice_g_explanation: item.choice_g_explanation,
          choice_h_explanation: item.choice_h_explanation,
          major_category: category.major_category,
          middle_category: category.middle_category,
          minor_category: category.minor_category,
          detail_category: category.detail_category,
          related_terms: item.related_terms,
          difficulty: generatedSet.difficulty,
          target_mistake_type: generatedSet.target_mistake_type,
          source_year: new Date().getFullYear(),
          syllabus_version: generatedSet.syllabus_version,
          valid_from: format(new Date(), "yyyy-MM-dd"),
          valid_until: null,
          is_current: true,
          is_current_exam_scope: true,
          revision_note: generatedSet.diff_from_original,
          validation_status: "passed",
          rule_reference_date: generatedSet.rule_reference_date,
          similar_question_blocked: false,
          audio_url: null,
          script_text: null,
          script_text_ja: null,
          created_at: now,
          updated_at: now,
        });
      }

      for (const question of questions) {
        await insertQuestion(question);
      }

      const firstQuestion = questions[0];
      return NextResponse.json({
        question: toPublicQuestion(firstQuestion),
        diffFromOriginal: generatedSet.diff_from_original,
        targetMistakeType: generatedSet.target_mistake_type,
        attempts: attempt,
      });
    }

    console.error(
      `類題セット生成: 検証不合格(${attempt}回目) answerId=${answerId} issues=`,
      validation.issues
    );
    previousIssues = validation.issues;
  }

  await updateQuestion({
    ...originalQuestion,
    similar_question_blocked: true,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error:
        "類題セットの生成に失敗しました(検証不合格が3回続いたため出題できません)。この問題は今後、類題生成の対象から除外されました。",
    },
    { status: 422 }
  );
}
