"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionAnswerForm } from "@/components/QuestionAnswerForm";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { ReportQuestionForm } from "@/components/ReportQuestionForm";
import { PublicQuestion } from "@/lib/questionPresenter";
import { ChoiceKey, ConfidenceLevel, MISTAKE_TYPE_LABELS, MistakeType } from "@/types/enums";

interface SimilarQuestionResponse {
  question: PublicQuestion;
  diffFromOriginal: string;
  targetMistakeType: MistakeType;
  attempts: number;
}

export default function SimilarQuestionPage() {
  const router = useRouter();
  const [data, setData] = useState<SimilarQuestionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastSimilarQuestion");
    if (raw) {
      setData(JSON.parse(raw) as SimilarQuestionResponse);
    }
  }, []);

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <BackToHomeLink />
        <p className="mt-3 text-sm text-gray-500">表示できる類題がありません。</p>
        <Link href="/quiz" className="mt-3 inline-block text-sm text-blue-600 underline">
          問題を解く
        </Link>
      </div>
    );
  }

  const { question, diffFromOriginal, targetMistakeType } = data;

  const handleSubmit = async (params: {
    selectedChoice: ChoiceKey;
    confidenceLevel: ConfidenceLevel | null;
    answerTimeSeconds: number;
  }) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.question_id,
          ...params,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "採点に失敗しました");

      sessionStorage.setItem(
        "lastResult",
        JSON.stringify({ question, selectedChoice: params.selectedChoice, result })
      );
      router.push("/quiz/result");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
        <BackToHomeLink />
        <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <p className="font-semibold">この問題はAIが生成した類題です。</p>
          <p className="mt-1">難易度: {question.difficulty} / 5</p>
          <p className="mt-1">
            対象となるミス傾向: {MISTAKE_TYPE_LABELS[targetMistakeType]}
          </p>
          <p className="mt-1">元となった苦手論点: {question.minor_category}</p>
          <p className="mt-1">この問題を作成した目的(元問題との違い): {diffFromOriginal}</p>
          <p className="mt-1">基準日: {question.rule_reference_date}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <QuestionAnswerForm
          question={question}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 sm:px-6">
        <ReportQuestionForm questionId={question.question_id} />
      </div>
    </div>
  );
}
