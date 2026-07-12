"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WeakPointStats } from "@/lib/analysis/computeWeakPointStats";
import { HomeReminders } from "@/lib/analysis/computeHomeReminders";
import { MISTAKE_TYPE_LABELS, MistakeType } from "@/types/enums";
import { RegisteredExam } from "@/lib/examPresenter";
import { DEFAULT_EXAM_THEME, getExamTheme } from "@/components/examTheme";
import { AppHeader } from "@/components/AppHeader";

function IconWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      {children}
    </svg>
  );
}

function ListIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </IconWrapper>
  );
}

function ChartIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M5 19V10M12 19V5M19 19v-6" />
    </IconWrapper>
  );
}

function FlagIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M6 20V4" />
      <path d="M6 5h11l-2.5 3.5L17 12H6" />
    </IconWrapper>
  );
}

function AlertIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </IconWrapper>
  );
}

function CalendarIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
      <path d="M8 3v4M16 3v4" />
    </IconWrapper>
  );
}

function ChevronDownIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M6 9l6 6 6-6" />
    </IconWrapper>
  );
}

function ChevronRightIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconWrapper>
  );
}

function BellIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconWrapper>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<RegisteredExam | null>(null);
  const [otherExams, setOtherExams] = useState<RegisteredExam[]>([]);
  const [plannedExamDate, setPlannedExamDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WeakPointStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<HomeReminders | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);

  // 集計取得のfetch/パース処理本体(stateの更新は呼び出し側で行う)
  const fetchStats = async () => {
    const res = await fetch("/api/analysis");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "学習状況の取得に失敗しました");
    return data as { stats: WeakPointStats; reminders: HomeReminders };
  };

  // 受験予定日の保存後など、明示的な再取得用(読み込み中表示を出す)
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchStats();
      setStats(data.stats);
      setReminders(data.reminders);
      setStatsError(null);
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const loadCurrentExam = async () => {
      try {
        const res = await fetch("/api/user/exams");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "現在の試験の取得に失敗しました");
        if (!data.current) {
          router.replace("/exam-select");
          return;
        }
        setCurrentExam(data.current);
        setOtherExams(
          (data.registered as RegisteredExam[]).filter((r) => !r.is_current)
        );
        setPlannedExamDate(data.current.planned_exam_date ?? "");
        if (!data.current.planned_exam_date) {
          setIsEditingDate(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    // 初回マウント時はstatsLoadingが既にtrueのため、ここではsetStatsLoading(true)を呼ばない
    // (useEffect内での同期的なsetState呼び出しを避けるため)
    const loadInitialStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data.stats);
        setReminders(data.reminders);
        setStatsError(null);
      } catch (e) {
        setStatsError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setStatsLoading(false);
      }
    };

    // 試験情報と集計は互いに依存しないため、並列に取得する(試験情報は先に表示できる)
    void loadCurrentExam();
    void loadInitialStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannedExamDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "受験予定日の設定に失敗しました");
      setCurrentExam((prev) => (prev ? { ...prev, ...data.userExam } : prev));
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const accuracyPercent = stats ? Math.round(stats.overallAccuracyRate * 100) : 0;
  const weakAreaTop3 = stats?.weakAreaTop3 ?? [];
  const examTheme = currentExam ? getExamTheme(currentExam.exam_id) : DEFAULT_EXAM_THEME;
  const ExamIcon = examTheme.icon;
  const topMistakeLabel = statsLoading
    ? "…"
    : stats && stats.recentMistakeTypeFrequency.length > 0
      ? MISTAKE_TYPE_LABELS[
          stats.recentMistakeTypeFrequency[0].mistakeType as MistakeType
        ]
      : "データ収集中";
  // 集計読み込み中は「0%」等の実データに見える値を出さず、明確な読み込み中表示にする
  const answeredTodayDisplay = statsLoading ? "…" : `${stats ? stats.answeredToday : 0}問`;
  const accuracyPercentDisplay = statsLoading ? "…" : `${accuracyPercent}%`;

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="ホーム" />

        {loading || !currentExam ? (
          <p className="p-4 text-sm text-gray-500">読み込み中...</p>
        ) : (
          <main className="flex flex-col gap-4 p-4 md:p-6">
            {/* 現在選択中の試験(切り替えは既存の試験選択画面へ遷移するのみ) */}
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

            {/* 復習・学習リマインドバナー(ホーム画面表示のみ、通知等は行わない) */}
            {reminders && reminders.reviewNeededCount > 0 && (
              <Link
                href="/study/mistakes"
                className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900"
              >
                <BellIcon className="h-4 w-4 shrink-0 text-orange-500" />
                <span className="flex-1">
                  復習が必要な問題が{reminders.reviewNeededCount}問あります
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-orange-400" />
              </Link>
            )}

            {reminders?.showStudyReminder && (
              <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <BellIcon className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="flex-1">
                  {reminders.daysUntilExam !== null
                    ? `受験まであと${reminders.daysUntilExam}日です。学習を進めましょう`
                    : `${reminders.daysSinceLastStudy}日間学習していません。今日も少し解いてみましょう`}
                </span>
              </div>
            )}

            {/* メインの学習導線: 学習メニュー画面(/study)を経由する */}
            <button
              type="button"
              onClick={() => router.push("/study")}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${examTheme.solidBg}`}
                >
                  <ExamIcon className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-gray-900">
                    {currentExam.name}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">学習を始める</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">問題演習へ進む</p>
              <span className="mt-1 flex w-full items-center justify-center gap-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                今すぐ始める
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <ListIcon className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500">今日の問題</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {answeredTodayDisplay}
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <ChartIcon className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500">現在の正答率</p>
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">{accuracyPercentDisplay}</p>
              </section>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <FlagIcon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">苦手分野TOP3</p>
              </div>
              {statsLoading ? (
                <p className="mt-1 text-sm text-gray-400">読み込み中...</p>
              ) : weakAreaTop3.length === 0 ? (
                <p className="mt-1 text-sm text-gray-400">データ収集中</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2.5">
                  {weakAreaTop3.map((c, index) => {
                    const percent = Math.round(c.accuracyRate * 100);
                    const params = new URLSearchParams(
                      c.level === "major"
                        ? { majorCategory: c.label }
                        : { middleCategory: c.label }
                    );
                    return (
                      <li key={c.label}>
                        <Link
                          href={`/quiz?${params.toString()}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="shrink-0 text-xs font-semibold text-gray-400">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between text-gray-900">
                              <span className="truncate">{c.label}</span>
                              <span className="shrink-0 text-xs text-gray-500">
                                {percent}%({c.correctAnswers}/{c.totalAnswers})
                              </span>
                            </span>
                            <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <span
                                className="block h-full rounded-full bg-orange-400"
                                style={{ width: `${percent}%` }}
                              />
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <AlertIcon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">最近のミス傾向</p>
              </div>
              <p className="mt-1 text-base font-bold text-gray-900">{topMistakeLabel}</p>
            </section>

            {statsError && <p className="text-xs text-red-600">{statsError}</p>}

            {otherExams.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">他の試験</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {otherExams.map((exam) => {
                    const theme = getExamTheme(exam.exam_id);
                    const OtherIcon = theme.icon;
                    return (
                      <Link
                        key={exam.exam_id}
                        href="/exam-select"
                        className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
                      >
                        <OtherIcon className={`h-4 w-4 ${theme.fg}`} />
                        {exam.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">受験予定日</p>
              </div>
              {!isEditingDate ? (
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {plannedExamDate || "未設定"}
                    </p>
                    <p className="text-xs text-gray-400">{currentExam.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingDate(true)}
                    className="rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600"
                  >
                    変更
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={plannedExamDate}
                    onChange={(e) => setPlannedExamDate(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSave();
                      setIsEditingDate(false);
                    }}
                    disabled={!plannedExamDate || saving}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                </div>
              )}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              {currentExam?.target_syllabus_version && (
                <p className="mt-2 text-xs text-gray-400">
                  対象シラバス: {currentExam.target_syllabus_version}
                </p>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
