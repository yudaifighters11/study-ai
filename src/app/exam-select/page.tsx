"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { AppHeader } from "@/components/AppHeader";
import { Chip } from "@/components/Chip";

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
  return (
    <Suspense fallback={null}>
      <ExamSelectPageContent />
    </Suspense>
  );
}

function ExamSelectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ホーム・学習・分析画面の「その他」から来た場合、選択後に元の画面へ戻る(既定はホーム)。
  const returnTo = searchParams.get("from") || "/";
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
      router.push(returnTo);
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
                <div className="flex flex-wrap gap-2">
                  {filteredRegistered.map((r) => (
                    <Chip
                      key={r.exam_id}
                      label={r.name}
                      selected={r.exam_id === currentExamId}
                      disabled={
                        r.exam_id === currentExamId ||
                        selectingExamId === r.exam_id
                      }
                      onClick={() => void handleSelect(r.exam_id)}
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
                  <div className="flex flex-wrap gap-2">
                    {filtered.map((exam) => (
                      <Chip
                        key={exam.exam_id}
                        label={exam.name}
                        selected={exam.exam_id === currentExamId}
                        disabled={
                          exam.exam_id === currentExamId ||
                          selectingExamId === exam.exam_id
                        }
                        onClick={() => void handleSelect(exam.exam_id)}
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
