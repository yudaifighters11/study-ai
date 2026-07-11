"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { readPassageGroupAnswers } from "@/lib/quizSession";
import { getActiveChoiceKeys } from "@/lib/questionChoices";
import { MISTAKE_TYPE_LABELS } from "@/types/enums";
import type { StoredResult } from "@/app/quiz/result/page";

export default function PassageResultPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<StoredResult[] | null>(null);

  useEffect(() => {
    setEntries(readPassageGroupAnswers<StoredResult>());
  }, []);

  if (!entries) {
    return null;
  }

  if (entries.length === 0) {
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

  const correctCount = entries.filter((e) => e.result.isCorrect).length;
  const passageText = entries[0].question.passage_text;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <BackToHomeLink />

      <div>
        <h1 className="text-xl font-bold">セットの結果</h1>
        <p className="mt-1 text-sm text-gray-600">
          {correctCount}/{entries.length}問正解
        </p>
      </div>

      {passageText && (
        <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {passageText}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {entries.map(({ question, selectedChoice, result }) => (
          <section
            key={question.question_id}
            className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold ${
                  result.isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {result.isCorrect ? "正解" : "不正解"}
              </span>
              <span className="text-xs text-gray-400">
                設問{question.passage_order}
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed text-gray-900">
              {question.question_text}
            </p>

            <p className="text-xs text-gray-600">
              あなたの回答: {selectedChoice.toUpperCase()} / 正解:{" "}
              {result.evaluatedCorrectChoice.toUpperCase()}
            </p>

            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">解説</p>
              <p className="mt-1 text-sm text-gray-700">{result.explanations.current}</p>
            </div>

            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700">各選択肢の解説</p>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-gray-700">
                {getActiveChoiceKeys(question).map((key) => (
                  <li key={key}>
                    <span className="font-semibold uppercase">{key}.</span>{" "}
                    {result.explanations[`choice_${key}`]}
                  </li>
                ))}
              </ul>
            </div>

            {result.mistakeAnalysis && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">AIによるミス原因分析</p>
                <p className="mt-1 text-sm text-blue-900">
                  推定されるミス分類:{" "}
                  {MISTAKE_TYPE_LABELS[result.mistakeAnalysis.mistake_type]}
                </p>
                <p className="mt-1 text-sm text-blue-900">
                  {result.mistakeAnalysis.analysis_comment}
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push("/quiz")}
        className="rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
      >
        次の問題へ
      </button>
    </main>
  );
}
