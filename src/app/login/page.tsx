"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getAuthBrowserClient } from "@/lib/supabase/authBrowserClient";

type Mode = "login" | "signup";

const AGE_GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: "10s", label: "10代" },
  { value: "20s", label: "20代" },
  { value: "30s", label: "30代" },
  { value: "40s", label: "40代" },
  { value: "50s_plus", label: "50代以上" },
  { value: "unanswered", label: "回答しない" },
];

const OCCUPATION_OPTIONS: { value: string; label: string }[] = [
  { value: "junior_high", label: "中学生" },
  { value: "high_school", label: "高校生" },
  { value: "university", label: "大学生・大学院生" },
  { value: "working_adult", label: "社会人" },
  { value: "other", label: "その他" },
  { value: "unanswered", label: "回答しない" },
];

interface Exam {
  exam_id: string;
  name: string;
  category: string;
  display_order: number;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // /welcome の「新しくはじめる」から遷移した場合、最初から新規登録モードで開く
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [occupation, setOccupation] = useState("");
  const [plannedExamDate, setPlannedExamDate] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "signup" || exams.length > 0) return;
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => setExams(data.exams ?? []))
      .catch(() => setExams([]));
  }, [mode, exams.length]);

  const categorizedExams = useMemo(() => {
    const map = new Map<string, Exam[]>();
    for (const exam of exams) {
      const list = map.get(exam.category) ?? [];
      list.push(exam);
      map.set(exam.category, list);
    }
    return Array.from(map.entries());
  }, [exams]);

  const canSubmit =
    !submitting &&
    email.trim() &&
    password.trim() &&
    (mode === "login" ||
      (displayName.trim() && examId && termsAgreed));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = getAuthBrowserClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw new Error(signUpError.message);
        if (!data.session) {
          throw new Error(
            "サインアップに失敗しました。時間をおいて再度お試しください。"
          );
        }

        const res = await fetch("/api/auth/register-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            examId,
            termsAgreed: true,
            ageGroup:
              ageGroup && ageGroup !== "unanswered" ? ageGroup : null,
            occupation:
              occupation && occupation !== "unanswered" ? occupation : null,
            plannedExamDate: plannedExamDate || null,
            targetScore: targetScore ? Number(targetScore) : null,
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error ?? "プロフィールの作成に失敗しました");
        }

        // サインアップ直後は、必ずプラン選択画面を通ってからホームへ進む。
        router.push("/plan");
        router.refresh();
        return;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw new Error(signInError.message);
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title={mode === "login" ? "ログイン" : "新規登録"} />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: 山田太郎"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">
                  最初に学習する試験
                </label>
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
                >
                  <option value="">選択してください</option>
                  {categorizedExams.map(([category, categoryExams]) => (
                    <optgroup key={category} label={category}>
                      {categoryExams.map((exam) => (
                        <option key={exam.exam_id} value={exam.exam_id}>
                          {exam.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>

            {mode === "signup" && (
              <>
                <div className="mt-1 border-t border-gray-100 pt-3">
                  <p className="mb-3 text-xs font-semibold text-gray-400">
                    以下は任意項目です(未回答・未定でも登録できます)
                  </p>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        年代
                      </label>
                      <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      >
                        <option value="">未選択</option>
                        {AGE_GROUP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        身分
                      </label>
                      <select
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      >
                        <option value="">未選択</option>
                        {OCCUPATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        受験予定日(未定可)
                      </label>
                      <input
                        type="date"
                        value={plannedExamDate}
                        onChange={(e) => setPlannedExamDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        目標スコア・目標点(未定可)
                      </label>
                      <input
                        type="number"
                        value={targetScore}
                        onChange={(e) => setTargetScore(e.target.value)}
                        placeholder="例: 800"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 underline"
                    >
                      利用規約
                    </a>
                    および
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 underline"
                    >
                      プライバシーポリシー
                    </a>
                    に同意します
                  </span>
                </label>
              </>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="text-center text-xs font-semibold text-blue-600"
          >
            {mode === "login"
              ? "アカウントをお持ちでない方はこちら"
              : "すでにアカウントをお持ちの方はこちら"}
          </button>
        </main>
      </div>
    </div>
  );
}
