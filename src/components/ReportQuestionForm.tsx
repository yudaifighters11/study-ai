"use client";

import { useState } from "react";
import { REPORT_REASONS, REPORT_REASON_LABELS, ReportReason } from "@/types/enums";

interface ReportQuestionFormProps {
  questionId: string;
}

/**
 * 7-4 AI類題画面の「問題内容を報告するボタン」。
 */
export function ReportQuestionForm({ questionId }: ReportQuestionFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-xs text-gray-500">
        報告を受け付けました。ご協力ありがとうございます。この問題は確認が完了するまで出題対象から外れます。
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 underline"
      >
        問題内容を報告する
      </button>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/question-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "報告の送信に失敗しました");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm">
      <p className="mb-2 font-medium text-gray-700">問題内容を報告する</p>
      <div className="mb-2 flex flex-col gap-1">
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-gray-700">
            <input
              type="radio"
              name="report-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            {REPORT_REASON_LABELS[r]}
          </label>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="詳細があれば入力してください(任意)"
        className="mb-2 w-full rounded border border-gray-300 p-2 text-sm"
        rows={2}
        maxLength={1000}
      />
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
