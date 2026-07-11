"use client";

import { useEffect, useState } from "react";
import { ChoiceKey, ConfidenceLevel } from "@/types/enums";
import { PublicQuestion } from "@/lib/questionPresenter";
import { getActiveChoiceKeys, getChoiceText } from "@/lib/questionChoices";
import { getExamTheme } from "@/components/examTheme";
import { ConfidenceSelector } from "./ConfidenceSelector";

interface QuestionAnswerFormProps {
  question: PublicQuestion;
  onSubmit: (params: {
    selectedChoice: ChoiceKey;
    confidenceLevel: ConfidenceLevel | null;
    answerTimeSeconds: number;
  }) => void | Promise<void>;
  submitting: boolean;
  submitError?: string | null;
  headerBadge?: React.ReactNode;
}

/**
 * 過去問画面・AI類題画面で共通利用する回答フォーム。
 * セクション7-2の要素(問題文/選択肢4つ/自信度3択/回答ボタン/解答時間計測/出題年度/対応シラバス/有効性)を表示する。
 */
export function QuestionAnswerForm({
  question,
  onSubmit,
  submitting,
  submitError,
  headerBadge,
}: QuestionAnswerFormProps) {
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel | null>(
    null
  );
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    setSelectedChoice(null);
    setConfidenceLevel(null);
    setStartedAt(Date.now());
  }, [question.question_id]);

  const canSubmit = selectedChoice !== null && !submitting;
  const examTheme = getExamTheme(question.exam_type);

  const handleSubmit = () => {
    if (!selectedChoice) return;
    const answerTimeSeconds = Math.round((Date.now() - startedAt) / 1000);
    void onSubmit({ selectedChoice, confidenceLevel, answerTimeSeconds });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-gray-200 px-2 py-1">
          出題年度: {question.source_year}
        </span>
        {question.syllabus_version !== "N/A" && (
          <span className="rounded bg-gray-200 px-2 py-1">
            対応シラバス: {question.syllabus_version}
          </span>
        )}
        <span className="rounded bg-gray-200 px-2 py-1">
          {question.is_current && question.is_current_exam_scope
            ? "現在も出題対象の問題です"
            : "現在は出題対象外の問題です"}
        </span>
        {question.passage_order && question.passage_total_questions && (
          <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">
            設問 {question.passage_order}/{question.passage_total_questions}
          </span>
        )}
        {headerBadge}
      </div>

      <span
        className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold ${examTheme.badgeBg}`}
      >
        {question.middle_category}
      </span>

      {question.passage_text && (
        <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {question.passage_text}
        </div>
      )}

      <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-gray-900">
        {question.question_text}
      </p>

      <div className="flex flex-col gap-2.5">
        {getActiveChoiceKeys(question).map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedChoice(key)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              selectedChoice === key
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedChoice === key ? "border-blue-600" : "border-gray-300"
              }`}
            >
              {selectedChoice === key && (
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              )}
            </span>
            <span className="text-gray-900">
              {i + 1}. {getChoiceText(question, key)}
            </span>
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500">自信度(任意)</p>
        <ConfidenceSelector value={confidenceLevel} onChange={setConfidenceLevel} />
      </div>

      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting ? "採点中..." : "回答する"}
      </button>
    </div>
  );
}
