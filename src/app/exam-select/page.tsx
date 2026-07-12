"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { AppHeader } from "@/components/AppHeader";

interface Exam {
  exam_id: string;
  name: string;
  category: string;
  display_order: number;
}

interface RegisteredExam {
  exam_id: string;
  name: string;
  category: string;
  is_current: boolean;
  last_studied_at: string | null;
}

export default function ExamSelectPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [registered, setRegistered] = useState<RegisteredExam[]>([]);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingExamId, setSelectingExamId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [examsRes, userExamsRes] = await Promise.all([
          fetch("/api/exams"),
          fetch("/api/user/exams"),
        ]);
        const examsData = await examsRes.json();
        const userExamsData = await userExamsRes.json();
        if (!examsRes.ok) throw new Error(examsData.error ?? "試験一覧の取得に失敗しました");
        if (!userExamsRes.ok) throw new Error(userExamsData.error ?? "登録済み試験の取得に失敗しました");

        setExams(examsData.exams);
        setRegistered(userExamsData.registered);
        setCurrentExamId(userExamsData.current?.exam_id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const registeredExamIds = useMemo(
    () => new Set(registered.map((r) => r.exam_id)),
    [registered]
  );

  const categories = useMemo(() => {
    const map = new Map<string, Exam[]>();
    for (const exam of exams) {
      const list = map.get(exam.category) ?? [];
      list.push(exam);
      map.set(exam.category, list);
    }
    return Array.from(map.entries());
  }, [exams]);

  const matchesQuery = (name: string) =>
    query.trim() === "" || name.toLowerCase().includes(query.trim().toLowerCase());

  const filteredRegistered = registered.filter((r) => matchesQuery(r.name));

  const handleSelect = async (examId: string) => {
    setSelectingExamId(examId);
    setError(null);
    try {
      const res = await fetch("/api/user/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "試験の選択に失敗しました");
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      setSelectingExamId(null);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="試験を選択" />

        {loading ? (
          <p className="p-4 text-sm text-gray-500">読み込み中...</p>
        ) : (
          <main className="flex flex-col gap-4 p-4 md:p-6">
            <BackToHomeLink />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="試験名で検索"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            {filteredRegistered.length > 0 && (
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500">
                  学習中の試験
                </p>
                <div className="flex flex-col gap-2">
                  {filteredRegistered.map((r) => (
                    <ExamRow
                      key={r.exam_id}
                      name={r.name}
                      isCurrent={r.exam_id === currentExamId}
                      isRegistered
                      disabled={selectingExamId === r.exam_id}
                      onSelect={() => void handleSelect(r.exam_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {categories.map(([category, categoryExams]) => {
              const filtered = categoryExams.filter((e) => matchesQuery(e.name));
              if (filtered.length === 0) return null;
              return (
                <section key={category} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    {category}
                  </p>
                  <div className="flex flex-col gap-2">
                    {filtered.map((exam) => (
                      <ExamRow
                        key={exam.exam_id}
                        name={exam.name}
                        isCurrent={exam.exam_id === currentExamId}
                        isRegistered={registeredExamIds.has(exam.exam_id)}
                        disabled={selectingExamId === exam.exam_id}
                        onSelect={() => void handleSelect(exam.exam_id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </main>
        )}
      </div>
    </div>
  );
}

function ExamRow({
  name,
  isCurrent,
  isRegistered,
  disabled,
  onSelect,
}: {
  name: string;
  isCurrent: boolean;
  isRegistered: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        isCurrent
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-gray-900">
          {name}
        </span>
        {isCurrent && (
          <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            選択中
          </span>
        )}
      </div>
      {!isCurrent && (
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className="shrink-0 rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistered ? "選択する" : "追加する"}
        </button>
      )}
    </div>
  );
}
