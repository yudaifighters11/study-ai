import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getAllQuestions, insertQuestion } from "@/lib/csv/questionRepository";
import {
  generateListeningQuestion,
  PreviousListeningQuestion,
} from "@/lib/openai/generateListeningQuestion";
import { validateGeneratedListeningQuestion } from "@/lib/openai/validateListeningQuestion";
import { toPublicQuestion } from "@/lib/questionPresenter";
import { Question } from "@/types/question";
import { PART2_TOPICS } from "@/lib/listening/part2Topics";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z.object({
  topic: z.enum(PART2_TOPICS),
});

// 4-3 検証不合格時の再生成上限(セクション4-3、11で確定済み)
const MAX_ATTEMPTS = 3;

const LISTENING_EXAM_TYPE = "toeic_listening";
const LISTENING_MAJOR_CATEGORY = "Part 2";
const LISTENING_MIDDLE_CATEGORY = "応答問題";

/**
 * TOEICリスニング Part2(応答問題)の新規問題を、指定したtopicから生成・検証して保存する。
 * Stage 2時点では管理・開発用のバックエンド機能であり、画面からは呼び出さない
 * (実際の過去問音声は著作権上使用できないため、他の試験のような「間違えた問題から類題生成」ではなく、
 * topicを直接指定してゼロから問題を作成する)。
 * 音声合成(TTS)・Supabase Storageへのアップロードは別段階で対応するため、audio_urlはnullのまま保存する。
 */
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
  const { topic } = parsed.data;

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // 同じtopicで既に生成済みの問題(場面設定の重複を避けるため、新規生成時のプロンプトに使う)
  const existingQuestions = await getAllQuestions(LISTENING_EXAM_TYPE);
  const previousQuestions: PreviousListeningQuestion[] = existingQuestions
    .filter((q) => q.detail_category === topic)
    .map((q) => ({ question_text: q.question_text }));

  let previousIssues: string[] | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const generated = await generateListeningQuestion({
      topic,
      previousQuestions,
      previousIssues,
    });

    const validation = await validateGeneratedListeningQuestion({
      generatedQuestion: generated,
      topic,
    });

    if (validation.passed) {
      const now = new Date().toISOString();
      const today = format(new Date(), "yyyy-MM-dd");
      const scriptText = `${generated.question_text}\nA. ${generated.choice_a}\nB. ${generated.choice_b}\nC. ${generated.choice_c}`;

      const question: Question = {
        question_id: uuidv4(),
        exam_type: LISTENING_EXAM_TYPE,
        question_type: "original",
        original_question_id: null,
        question_text: generated.question_text,
        passage_text: null,
        passage_group_id: null,
        passage_order: null,
        passage_total_questions: null,
        choice_a: generated.choice_a,
        choice_b: generated.choice_b,
        choice_c: generated.choice_c,
        choice_d: null,
        choice_e: null,
        choice_f: null,
        choice_g: null,
        choice_h: null,
        original_correct_choice: generated.correct_choice,
        current_correct_choice: generated.correct_choice,
        original_explanation: generated.correct_explanation,
        current_explanation: generated.correct_explanation,
        choice_a_explanation: generated.choice_a_explanation,
        choice_b_explanation: generated.choice_b_explanation,
        choice_c_explanation: generated.choice_c_explanation,
        choice_d_explanation: null,
        choice_e_explanation: null,
        choice_f_explanation: null,
        choice_g_explanation: null,
        choice_h_explanation: null,
        major_category: LISTENING_MAJOR_CATEGORY,
        middle_category: LISTENING_MIDDLE_CATEGORY,
        minor_category: generated.minor_category,
        detail_category: topic,
        related_terms: generated.related_terms,
        difficulty: generated.difficulty,
        target_mistake_type: null,
        source_year: new Date().getFullYear(),
        syllabus_version: "N/A",
        valid_from: today,
        valid_until: null,
        is_current: true,
        is_current_exam_scope: true,
        revision_note: "",
        validation_status: "passed",
        rule_reference_date: today,
        similar_question_blocked: false,
        audio_url: null,
        script_text: scriptText,
        script_text_ja: null,
        graphic_table: null,
        created_at: now,
        updated_at: now,
      };

      await insertQuestion(question);

      return NextResponse.json({
        question: toPublicQuestion(question),
        topic,
        attempts: attempt,
      });
    }

    console.error(
      `リスニング問題生成: 検証不合格(${attempt}回目) topic=${topic} issues=`,
      validation.issues
    );
    previousIssues = validation.issues;
  }

  return NextResponse.json(
    {
      error:
        "問題の生成に失敗しました(検証不合格が3回続いたため保存できません)。",
    },
    { status: 422 }
  );
}
