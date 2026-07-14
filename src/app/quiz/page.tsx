"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ListeningDisplaySettings,
  QuestionAnswerForm,
} from "@/components/QuestionAnswerForm";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { DEFAULT_EXAM_THEME, getExamTheme } from "@/components/examTheme";
import { AppHeader } from "@/components/AppHeader";
import { PublicQuestion } from "@/lib/questionPresenter";
import { RegisteredExam } from "@/lib/examPresenter";
import { ChoiceKey, ConfidenceLevel } from "@/types/enums";
import {
  appendPassageGroupAnswer,
  QuizSession,
  readQuizSession,
  recordQuizSessionAnswer,
  resetPassageGroupAnswers,
} from "@/lib/quizSession";

function ChevronDownIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className ?? "h-4 w-4"}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizPageContent />
    </Suspense>
  );
}

const LISTENING_DISPLAY_API_KEYS: Record<keyof ListeningDisplaySettings, string> = {
  showQuestionText: "listeningShowQuestionText",
  showChoiceText: "listeningShowChoiceText",
  showConversationText: "listeningShowConversationText",
};

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const isHistorical = searchParams.get("mode") === "historical";
  const passageGroupId = searchParams.get("passageGroupId");
  const passageOrder = searchParams.get("passageOrder");
  const majorCategoryParam = searchParams.get("majorCategory");
  const middleCategoryParam = searchParams.get("middleCategory");
  const minorCategoryParam = searchParams.get("minorCategory");
  const detailCategoryParam = searchParams.get("detailCategory");
  const questionIdParam = searchParams.get("questionId");
  const isRetry = !!questionIdParam;
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentExam, setCurrentExam] = useState<RegisteredExam | null>(null);
  const [listeningDisplay, setListeningDisplay] =
    useState<ListeningDisplaySettings | null>(null);

  useEffect(() => {
    // 「過去の問題を見る」モード・間違えた問題の解き直しは問題数セッションの対象外(採点に組み込まない)
    setSession(isHistorical || isRetry ? null : readQuizSession());
  }, [isHistorical, isRetry]);

  useEffect(() => {
    const loadCurrentExam = async () => {
      try {
        const res = await fetch("/api/user/exams");
        const data = await res.json();
        if (res.ok && data.current) {
          setCurrentExam(data.current);
        }
      } catch {
        // 試験切り替え行の表示のみに使う情報のため、失敗しても致命的ではない
      }
    };
    void loadCurrentExam();
  }, []);

  useEffect(() => {
    const loadListeningDisplay = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (res.ok && data.user) {
          setListeningDisplay({
            showQuestionText: data.user.listening_show_question_text,
            showChoiceText: data.user.listening_show_choice_text,
            showConversationText: data.user.listening_show_conversation_text,
          });
        }
      } catch {
        // 表示設定の取得のみに使う情報のため、失敗しても致命的ではない(既定値のまま表示)
      }
    };
    void loadListeningDisplay();
  }, []);

  const handleChangeListeningDisplay = (
    field: keyof ListeningDisplaySettings,
    value: boolean
  ) => {
    setListeningDisplay((prev) => ({
      showQuestionText: prev?.showQuestionText ?? true,
      showChoiceText: prev?.showChoiceText ?? true,
      showConversationText: prev?.showConversationText ?? false,
      [field]: value,
    }));
    void fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [LISTENING_DISPLAY_API_KEYS[field]]: value,
      }),
    });
  };

  useEffect(() => {
    const loadQuestion = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams();
        if (questionIdParam) {
          params.set("questionId", questionIdParam);
          const res = await fetch(`/api/questions?${params.toString()}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "問題の取得に失敗しました");
          setQuestion(data.question);
          return;
        }
        if (category) params.set("category", category);
        if (isHistorical) params.set("mode", "historical");
        if (passageGroupId && passageOrder) {
          params.set("passageGroupId", passageGroupId);
          params.set("passageOrder", passageOrder);
        } else if (
          majorCategoryParam ||
          middleCategoryParam ||
          minorCategoryParam ||
          detailCategoryParam
        ) {
          // ホーム画面の苦手分野リンクなど、URLで直接分野を指定された場合はそれを優先する
          if (majorCategoryParam) params.set("majorCategory", majorCategoryParam);
          if (middleCategoryParam) params.set("middleCategory", middleCategoryParam);
          if (minorCategoryParam) params.set("minorCategory", minorCategoryParam);
          if (detailCategoryParam) params.set("detailCategory", detailCategoryParam);
        } else if (!isHistorical) {
          // 学習メニューの分野指定機能で開始したセッションであれば、セッション中ずっと同じ分野・難易度に絞り込む
          const currentSession = readQuizSession();
          const filter = currentSession?.categoryFilter;
          if (filter?.majorCategory) params.set("majorCategory", filter.majorCategory);
          if (filter?.middleCategory) params.set("middleCategory", filter.middleCategory);
          if (filter?.minorCategory) params.set("minorCategory", filter.minorCategory);
          if (filter?.detailCategory) params.set("detailCategory", filter.detailCategory);
          if (filter?.difficulty) {
            for (const d of filter.difficulty) params.append("difficulty", String(d));
          }
        }
        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/questions${query}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "問題の取得に失敗しました");
        setQuestion(data.question);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    void loadQuestion();
  }, [
    category,
    isHistorical,
    passageGroupId,
    passageOrder,
    majorCategoryParam,
    middleCategoryParam,
    minorCategoryParam,
    detailCategoryParam,
    questionIdParam,
  ]);

  const handleSubmit = async (params: {
    selectedChoice: ChoiceKey;
    confidenceLevel: ConfidenceLevel | null;
    answerTimeSeconds: number;
  }) => {
    if (!question) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.question_id,
          mode: isHistorical ? "historical" : "current",
          ...params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "採点に失敗しました");

      if (session) {
        recordQuizSessionAnswer(Boolean(data.isCorrect));
      }

      const isGrouped =
        question.passage_group_id &&
        question.passage_order &&
        question.passage_total_questions;

      if (isGrouped) {
        // セット(1つの文書を共有する複数設問)の場合、個別の結果画面は挟まず、
        // 各設問の結果を貯めておいて、セットの最後にまとめて表示する。
        if (question.passage_order === 1) {
          resetPassageGroupAnswers();
        }
        appendPassageGroupAnswer({
          question,
          selectedChoice: params.selectedChoice,
          result: data,
        });

        if (question.passage_order! < question.passage_total_questions!) {
          const nextParams = new URLSearchParams({
            passageGroupId: question.passage_group_id!,
            passageOrder: String(question.passage_order! + 1),
          });
          router.push(`/quiz?${nextParams.toString()}`);
          return;
        }

        router.push(
          `/quiz/passage-result?passageGroupId=${encodeURIComponent(question.passage_group_id!)}`
        );
        return;
      }

      sessionStorage.setItem(
        "lastResult",
        JSON.stringify({ question, selectedChoice: params.selectedChoice, result: data })
      );
      router.push("/quiz/result");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const examTheme = currentExam ? getExamTheme(currentExam.exam_id) : DEFAULT_EXAM_THEME;
  const ExamIcon = examTheme.icon;
  const currentNumber = session ? session.index + 1 : null;
  const progressPercent =
    session && session.total > 0
      ? Math.min(100, Math.round((session.index / session.total) * 100))
      : null;

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="過去問" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <BackToHomeLink />

          {currentExam && (
            <Link
              href="/exam-select"
              className="flex w-fit min-w-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5"
            >
              <ExamIcon className={`h-5 w-5 shrink-0 ${examTheme.fg}`} />
              <p className="truncate text-base font-bold text-gray-900">
                {currentExam.name}
              </p>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>
          )}

          {currentNumber !== null && progressPercent !== null && session && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>
                  問題 {currentNumber}/{session.total}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {loading && (
            <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
          )}
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}

          {!loading && !loadError && question && (
            <QuestionAnswerForm
              question={question}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitError={submitError}
              listeningDisplay={listeningDisplay ?? undefined}
              onChangeListeningDisplay={handleChangeListeningDisplay}
              headerBadge={
                isHistorical ? (
                  <span className="rounded bg-amber-200 px-2 py-1 text-amber-900">
                    過去問(当時のルールで採点)
                  </span>
                ) : isRetry ? (
                  <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">
                    間違えた問題の解き直し
                  </span>
                ) : null
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
