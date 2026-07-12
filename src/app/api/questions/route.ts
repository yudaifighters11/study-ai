import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getCurrentUserExam } from "@/lib/csv/userExamRepository";
import { getQuestionsForFiltering, getQuestionById } from "@/lib/csv/questionRepository";
import { getExamById } from "@/lib/csv/examRepository";
import { getAllSyllabusVersions } from "@/lib/csv/syllabusRepository";
import { filterHistoricalQuestions, filterValidQuestions } from "@/lib/syllabus/filterValidQuestions";
import { toPublicQuestion } from "@/lib/questionPresenter";
import { toErrorResponse } from "@/lib/apiErrorHandler";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const currentExam = await getCurrentUserExam(userId);
    if (!currentExam) {
      return NextResponse.json(
        { error: "学習対象の試験が未設定です。先に試験を選択してください。" },
        { status: 400 }
      );
    }

    const exam = await getExamById(currentExam.exam_id);
    if (!exam) {
      return NextResponse.json(
        { error: "指定された試験が見つかりません" },
        { status: 400 }
      );
    }

    // シラバスバージョンが登録されている試験は、受験予定日から判定した対象シラバスが必須。
    // シラバス体系を持たない試験(TOEIC等)は、シラバスバージョンを問わずis_current等のみで判定する。
    const syllabusVersions = await getAllSyllabusVersions();
    const hasSyllabusSystem = syllabusVersions.some(
      (sv) => sv.exam_type === exam.exam_id
    );
    if (hasSyllabusSystem && !currentExam.target_syllabus_version) {
      return NextResponse.json(
        {
          error:
            "受験予定日が未設定です。先にホーム画面で受験予定日を設定してください。",
        },
        { status: 400 }
      );
    }
    const examType = exam.exam_id;
    const targetSyllabusVersion = hasSyllabusSystem
      ? currentExam.target_syllabus_version
      : null;

    // 間違えた問題の解き直し: question_idを直接指定された場合は、有効性フィルタを介さずその問題をそのまま返す。
    // (現在の試験に絞り込む前に、IDだけでピンポイントに取得する)
    const questionId = request.nextUrl.searchParams.get("questionId");
    if (questionId) {
      const question = await getQuestionById(questionId);
      if (!question) {
        return NextResponse.json(
          { error: "指定された問題が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ question: toPublicQuestion(question) });
    }

    // 現在の試験の問題だけを、出題可否の判定に必要な軽量な列だけで取得する
    // (問題文以外の重いテキスト列を毎回取得すると通信量・応答時間が無駄に増えるため)
    const allQuestions = await getQuestionsForFiltering(examType);

    // 「過去の問題を見る」モード: 現行の出題対象ではない問題(旧シラバス・出題対象外等)を出題する
    const mode = request.nextUrl.searchParams.get("mode");
    let validQuestions =
      mode === "historical"
        ? filterHistoricalQuestions(allQuestions, targetSyllabusVersion, examType)
        : filterValidQuestions(allQuestions, targetSyllabusVersion, examType);

    // 弱点分析画面の「苦手分野の類題を解く」ボタンなどから、大分野を指定して絞り込む(任意)
    const category = request.nextUrl.searchParams.get("category");
    if (category) {
      const narrowed = validQuestions.filter(
        (q) => q.major_category === category
      );
      if (narrowed.length > 0) {
        validQuestions = narrowed;
      }
    }

    // 学習メニューの「過去問を解く」の分野指定機能: 大中小分類・詳細分類を厳密に絞り込む(任意、複数指定可)。
    // 上記の緩やかなcategoryフィルタとは別に、指定した分野に該当がなければ404にする(該当なしを黙って無視しない)。
    const majorCategory = request.nextUrl.searchParams.get("majorCategory");
    const middleCategory = request.nextUrl.searchParams.get("middleCategory");
    const minorCategory = request.nextUrl.searchParams.get("minorCategory");
    const detailCategory = request.nextUrl.searchParams.get("detailCategory");
    if (majorCategory || middleCategory || minorCategory || detailCategory) {
      validQuestions = validQuestions.filter(
        (q) =>
          (!majorCategory || q.major_category === majorCategory) &&
          (!middleCategory || q.middle_category === middleCategory) &&
          (!minorCategory || q.minor_category === minorCategory) &&
          (!detailCategory || q.detail_category === detailCategory)
      );
      if (validQuestions.length === 0) {
        return NextResponse.json(
          { error: "指定した分野の問題が見つかりません" },
          { status: 404 }
        );
      }
    }

    // 学習メニューの難易度指定機能: 選択した難易度(複数可)のいずれかに絞り込む(任意)。
    const difficultyParams = request.nextUrl.searchParams.getAll("difficulty");
    if (difficultyParams.length > 0) {
      const difficulties = difficultyParams.map(Number);
      validQuestions = validQuestions.filter((q) =>
        difficulties.includes(q.difficulty)
      );
      if (validQuestions.length === 0) {
        return NextResponse.json(
          { error: "指定した難易度の問題が見つかりません" },
          { status: 404 }
        );
      }
    }

    // 1つの文書を共有する設問グループ内で、指定した順番の設問を取得する(Part6/7の複数設問セット用)。
    // 見つからない場合(グループの最後まで解き終えた等)は通常のランダム出題にフォールバックする。
    const passageGroupId = request.nextUrl.searchParams.get("passageGroupId");
    const passageOrderParam = request.nextUrl.searchParams.get("passageOrder");
    if (passageGroupId && passageOrderParam) {
      const passageOrder = Number(passageOrderParam);
      const nextInGroup = validQuestions.find(
        (q) =>
          q.passage_group_id === passageGroupId &&
          q.passage_order === passageOrder
      );
      if (nextInGroup) {
        const fullQuestion = await getQuestionById(nextInGroup.question_id);
        if (fullQuestion) {
          return NextResponse.json({ question: toPublicQuestion(fullQuestion) });
        }
      }
    }

    // ランダム出題の候補からは、設問グループの2問目以降(passage_order >= 2)を除外する。
    // グループは必ず1問目から順番に出題されるべきで、いきなり2問目・3問目が単独で出題されないようにする。
    const randomCandidates = validQuestions.filter(
      (q) => q.passage_group_id === null || q.passage_order === 1
    );

    if (randomCandidates.length === 0) {
      return NextResponse.json(
        {
          error:
            mode === "historical"
              ? "過去の問題が見つかりません"
              : "対象シラバスで出題可能な問題が見つかりません",
        },
        { status: 404 }
      );
    }

    const picked =
      randomCandidates[Math.floor(Math.random() * randomCandidates.length)];
    const question = await getQuestionById(picked.question_id);
    if (!question) {
      return NextResponse.json(
        { error: "指定された問題が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ question: toPublicQuestion(question) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
