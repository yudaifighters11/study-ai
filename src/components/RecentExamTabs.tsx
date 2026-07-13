"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getExamTheme } from "@/components/examTheme";
import { RegisteredExam } from "@/lib/examPresenter";

function ClockIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function ListIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

interface RecentExamTabsProps {
  currentExam: RegisteredExam;
  registeredExams: RegisteredExam[];
  onSwitched: (newCurrent: RegisteredExam, updatedRegistered: RegisteredExam[]) => void;
}

/**
 * ホーム・学習・分析の各画面共通の「最近使った」試験切り替えタブ。
 * 現在選択中の試験を必ず1つ目に、残りはlast_studied_at(最終学習日時)が新しい順に最大3件表示し、
 * 4つ目に「その他」ボタン(/exam-selectへの遷移)を置く。タブをタップすると即座に試験を切り替える。
 */
export function RecentExamTabs({
  currentExam,
  registeredExams,
  onSwitched,
}: RecentExamTabsProps) {
  const [switchingExamId, setSwitchingExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  // 「その他」から試験を選んだあと、元の画面(ホーム・学習・分析)に戻れるようにする。
  const examSelectHref = `/exam-select?from=${encodeURIComponent(pathname)}`;

  const recentExamTabs = [
    currentExam,
    ...registeredExams
      .filter((r) => r.exam_id !== currentExam.exam_id)
      .sort((a, b) => (b.last_studied_at ?? "").localeCompare(a.last_studied_at ?? "")),
  ].slice(0, 3);

  const handleSwitchExam = async (examId: string) => {
    if (examId === currentExam.exam_id || switchingExamId) return;
    setSwitchingExamId(examId);
    setError(null);
    try {
      const res = await fetch("/api/user/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "試験の切り替えに失敗しました");
      const newCurrent = data.current as RegisteredExam;
      const updatedRegistered = registeredExams.map((r) =>
        r.exam_id === examId ? newCurrent : { ...r, is_current: false }
      );
      onSwitched(newCurrent, updatedRegistered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSwitchingExamId(null);
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-bold text-blue-600">
          <ClockIcon className="h-3.5 w-3.5" />
          最近使った
        </span>
        <Link href={examSelectHref} className="flex items-center gap-1 text-[11px] text-gray-400">
          その他で全テストを表示
        </Link>
      </div>
      <div className="flex gap-2">
        {recentExamTabs.map((exam) => {
          const theme = getExamTheme(exam.exam_id);
          const TabIcon = theme.icon;
          const isActive = exam.exam_id === currentExam.exam_id;
          return (
            <button
              key={exam.exam_id}
              type="button"
              onClick={() => void handleSwitchExam(exam.exam_id)}
              disabled={switchingExamId !== null}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border p-3 text-center disabled:opacity-60 ${
                isActive ? "border-blue-500 bg-blue-50/40" : "border-gray-200 bg-white"
              }`}
            >
              <TabIcon className={`h-5 w-5 ${theme.fg}`} />
              <p className="text-xs font-semibold text-gray-900">
                {switchingExamId === exam.exam_id ? "切替中..." : exam.name}
              </p>
            </button>
          );
        })}
        <Link
          href={examSelectHref}
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-gray-200 bg-white p-3 text-center"
        >
          <ListIcon className="h-5 w-5 text-gray-500" />
          <p className="text-xs font-semibold text-gray-900">その他</p>
        </Link>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </section>
  );
}
