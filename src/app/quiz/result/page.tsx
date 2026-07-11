"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PublicQuestion } from "@/lib/questionPresenter";
import { ChoiceKey, MISTAKE_TYPE_LABELS } from "@/types/enums";
import { getActiveChoiceKeys } from "@/lib/questionChoices";
import { QuizSession, readQuizSession } from "@/lib/quizSession";

export interface MistakeAnalysisView {
  analysis_id: string;
  mistake_type: keyof typeof MISTAKE_TYPE_LABELS;
  confused_concepts: string[];
  analysis_comment: string;
  recommended_training: string;
  confidence_score: number;
  outdated_knowledge_influence: boolean;
}

export interface ResultView {
  answerId: string;
  isCorrect: boolean;
  evaluatedCorrectChoice: ChoiceKey;
  originalCorrectChoice: ChoiceKey;
  currentCorrectChoice: ChoiceKey;
  correctAnswerChanged: boolean;
  explanations: {
    original: string;
    current: string;
    choice_a: string;
    choice_b: string;
    choice_c: string;
    choice_d: string;
    choice_e: string | null;
    choice_f: string | null;
    choice_g: string | null;
    choice_h: string | null;
  };
  revisionNote: string;
  mistakeAnalysis: MistakeAnalysisView | null;
  mistakeAnalysisError: string | null;
  isHistoricalQuestion: boolean;
  currentExamScope: boolean;
  similarQuestionBlocked: boolean;
}

export interface StoredResult {
  question: PublicQuestion;
  selectedChoice: ChoiceKey;
  result: ResultView;
}

export default function QuizResultPage() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastResult");
    if (raw) {
      setStored(JSON.parse(raw) as StoredResult);
    }
    setSession(readQuizSession());
  }, []);

  if (!stored) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <BackToHomeLink />
        <p className="mt-3 text-sm text-gray-500">表示できる結果がありません。</p>
        <Link href="/quiz" className="mt-3 inline-block text-sm text-blue-600 underline">
          問題を解く
        </Link>
      </div>
    );
  }

  const { question, selectedChoice, result } = stored;

  const handleGenerateSimilar = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/similar-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId: result.answerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "類題の生成に失敗しました");
      sessionStorage.setItem("lastSimilarQuestion", JSON.stringify(data));
      router.push("/similar-question");
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <BackToHomeLink />

      <div>
        <p
          className={`text-lg font-bold ${
            result.isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.isCorrect ? "正解" : "不正解"}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          あなたの回答: {selectedChoice.toUpperCase()} / 正解: {result.evaluatedCorrectChoice.toUpperCase()}
        </p>
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">問題の解説</h2>
        <p className="text-sm text-gray-700">{result.explanations.current}</p>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">各選択肢の解説</h2>
        <ul className="flex flex-col gap-2 text-sm text-gray-700">
          {getActiveChoiceKeys(question).map((key) => (
            <li key={key}>
              <span className="font-semibold uppercase">{key}.</span>{" "}
              {result.explanations[`choice_${key}`]}
            </li>
          ))}
        </ul>
      </section>

      {(result.correctAnswerChanged || result.isHistoricalQuestion) && (
        <section className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            この問題は過去の制度に基づく問題です
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-amber-900">
            <li>出題当時の正解: {result.originalCorrectChoice.toUpperCase()}</li>
            <li>現在のルールに基づく正解: {result.currentCorrectChoice.toUpperCase()}</li>
            <li>変更された内容: {result.revisionNote || "(記載なし)"}</li>
            <li>
              現在の試験での扱い:{" "}
              {result.currentExamScope ? "現在も出題対象です" : "現在は出題対象外です"}
            </li>
          </ul>
        </section>
      )}

      {result.mistakeAnalysis && (
        <section className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-blue-900">AIによるミス原因分析</h2>
          <p className="text-sm text-blue-900">
            推定されるミス分類: {MISTAKE_TYPE_LABELS[result.mistakeAnalysis.mistake_type]}
          </p>
          {result.mistakeAnalysis.confused_concepts.length > 0 && (
            <p className="mt-1 text-sm text-blue-900">
              混同している可能性がある用語・概念: {result.mistakeAnalysis.confused_concepts.join("、")}
            </p>
          )}
          <p className="mt-1 text-sm text-blue-900">{result.mistakeAnalysis.analysis_comment}</p>
          <p className="mt-1 text-sm text-blue-900">
            次に行うべき学習: {result.mistakeAnalysis.recommended_training}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            分析の確信度: {Math.round(result.mistakeAnalysis.confidence_score * 100)}%
            (1問の結果のみに基づく暫定的な分析です)
          </p>
          {result.mistakeAnalysis.outdated_knowledge_influence && (
            <p className="mt-1 text-xs text-blue-700">
              古い知識・制度変更の影響を受けた可能性があります。
            </p>
          )}
        </section>
      )}

      {result.mistakeAnalysisError && (
        <section className="rounded-md border border-red-300 bg-red-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-red-800">
            AIによるミス原因分析でエラーが発生しました
          </h2>
          <p className="text-sm text-red-700">{result.mistakeAnalysisError}</p>
          <p className="mt-1 text-xs text-red-600">
            .env.local の OPENAI_API_KEY / OPENAI_GENERATION_MODEL の設定を確認してください。
          </p>
        </section>
      )}

      {generateError && <p className="text-sm text-red-600">{generateError}</p>}

      {result.mistakeAnalysis && result.similarQuestionBlocked && (
        <p className="text-xs text-gray-500">
          この問題は類題の自動生成に対応していません(過去に生成・検証を試みましたが、条件を満たす類題を作成できませんでした)。
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {result.mistakeAnalysis && !result.similarQuestionBlocked && (
          <button
            type="button"
            onClick={handleGenerateSimilar}
            disabled={generating}
            className="flex-1 rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {generating ? "類題を生成中..." : "類題を解く"}
          </button>
        )}
        {session && session.index >= session.total ? (
          <button
            type="button"
            onClick={() => router.push("/quiz/session-result")}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            結果を見る
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              router.push(result.isHistoricalQuestion ? "/quiz?mode=historical" : "/quiz")
            }
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            次の問題へ{session ? `(${session.index}/${session.total}問終了)` : ""}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">問題ID: {question.question_id}</p>
    </main>
  );
}
