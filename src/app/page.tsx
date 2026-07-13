"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WeakPointStats } from "@/lib/analysis/computeWeakPointStats";
import { HomeReminders } from "@/lib/analysis/computeHomeReminders";
import { MonthlyStudyStats } from "@/lib/analysis/computeMonthlyStudyStats";
import { MonthlyGoalProgress } from "@/lib/analysis/computeMonthlyGoalProgress";
import { MISTAKE_TYPE_LABELS, MistakeType } from "@/types/enums";
import { RegisteredExam } from "@/lib/examPresenter";
import { MonthlyStudyGoalType } from "@/types/userExam";
import { DEFAULT_EXAM_THEME, getExamTheme } from "@/components/examTheme";
import { AppHeader } from "@/components/AppHeader";
import { Chip } from "@/components/Chip";
import { RecentExamTabs } from "@/components/RecentExamTabs";

const HOUR_GOAL_OPTIONS = [5, 10, 20, 30, 50, 100];
const QUESTION_GOAL_OPTIONS = [20, 50, 100, 200, 300, 500];

const GOAL_TYPE_LABELS: Record<MonthlyStudyGoalType, string> = {
  hours: "時間",
  questions: "問",
};

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

function ChevronRightIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconWrapper>
  );
}

function LightbulbIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
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

function TargetGoalIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </IconWrapper>
  );
}

function ClockIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </IconWrapper>
  );
}

function TrendUpIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 16l5-5 4 4 7-7" />
      <path d="M14 8h6v6" />
    </IconWrapper>
  );
}

function CheckCircleIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </IconWrapper>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<RegisteredExam | null>(null);
  const [registeredExams, setRegisteredExams] = useState<RegisteredExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WeakPointStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<HomeReminders | null>(null);
  const [monthlyStudyStats, setMonthlyStudyStats] = useState<MonthlyStudyStats | null>(
    null
  );
  const [monthlyGoalProgress, setMonthlyGoalProgress] =
    useState<MonthlyGoalProgress | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTypeInput, setGoalTypeInput] = useState<MonthlyStudyGoalType>("hours");
  const [goalValueInput, setGoalValueInput] = useState<number | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  // 集計取得のfetch/パース処理本体(stateの更新は呼び出し側で行う)
  const fetchStats = async () => {
    const res = await fetch("/api/analysis");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "学習状況の取得に失敗しました");
    return data as {
      stats: WeakPointStats;
      reminders: HomeReminders;
      monthlyStudyStats: MonthlyStudyStats;
      monthlyGoalProgress: MonthlyGoalProgress | null;
    };
  };

  // 受験予定日の保存後など、明示的な再取得用(読み込み中表示を出す)
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchStats();
      setStats(data.stats);
      setReminders(data.reminders);
      setMonthlyStudyStats(data.monthlyStudyStats);
      setMonthlyGoalProgress(data.monthlyGoalProgress);
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
        setRegisteredExams(data.registered as RegisteredExam[]);
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
        setMonthlyStudyStats(data.monthlyStudyStats);
        setMonthlyGoalProgress(data.monthlyGoalProgress);
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

  const saveGoal = async (type: MonthlyStudyGoalType | null, value: number | null) => {
    setSavingGoal(true);
    try {
      const res = await fetch("/api/user/study-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyStudyGoalType: type,
          monthlyStudyGoalValue: value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setCurrentExam((prev) =>
        prev
          ? {
              ...prev,
              monthly_study_goal_type: data.userExam.monthly_study_goal_type,
              monthly_study_goal_value: data.userExam.monthly_study_goal_value,
            }
          : prev
      );
      setIsEditingGoal(false);
      await loadStats();
    } catch {
      // 失敗した場合は編集状態のまま残し、再入力できるようにする
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSaveGoal = () => {
    if (goalValueInput === null) return;
    void saveGoal(goalTypeInput, goalValueInput);
  };

  const handleClearGoal = () => {
    void saveGoal(null, null);
  };

  const openGoalEditor = () => {
    setGoalTypeInput((currentExam?.monthly_study_goal_type as MonthlyStudyGoalType) ?? "hours");
    setGoalValueInput(currentExam?.monthly_study_goal_value ?? null);
    setIsEditingGoal(true);
  };

  // 「最近使った」タブで試験を切り替えたときの反映(統計・リマインド等も再取得する)。
  const handleExamSwitched = (
    newCurrent: RegisteredExam,
    updatedRegistered: RegisteredExam[]
  ) => {
    setCurrentExam(newCurrent);
    setRegisteredExams(updatedRegistered);
    void loadStats();
  };

  const accuracyPercent = stats ? Math.round(stats.overallAccuracyRate * 100) : 0;
  const weakAreaTop3 = stats?.weakAreaTop3 ?? [];
  const accuracyCircumference = 2 * Math.PI * 40;
  const accuracyDashOffset =
    accuracyCircumference * (1 - accuracyPercent / 100);
  const topWeakArea = weakAreaTop3[0] ?? null;
  const topWeakAreaHref = topWeakArea
    ? `/quiz?${new URLSearchParams(
        topWeakArea.level === "major"
          ? { majorCategory: topWeakArea.label }
          : { middleCategory: topWeakArea.label }
      ).toString()}`
    : "/study";
  // ヒント文はAIを使わないルールベースの定型文(最も苦手な分野を1つ挙げるだけの簡易なもの)
  const weakAreaHint = topWeakArea
    ? `「${topWeakArea.label}」の正答率が${Math.round(topWeakArea.accuracyRate * 100)}%と低めです。重点的に復習しましょう。`
    : null;
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

  // 今月の目標(目標が設定されている場合のみホームに表示する)
  const goalType = currentExam?.monthly_study_goal_type ?? null;
  const goalTargetValue = currentExam?.monthly_study_goal_value ?? null;
  const goalUnit = goalType === "questions" ? "問" : "時間";
  const goalActualValue =
    goalType === "questions"
      ? monthlyStudyStats?.questionCount ?? null
      : monthlyStudyStats
        ? Number(monthlyStudyStats.hours.toFixed(1))
        : null;
  const hasMonthlyGoal =
    goalType !== null && goalTargetValue !== null && goalActualValue !== null;
  const projectedValue = monthlyGoalProgress
    ? Math.round(monthlyGoalProgress.projectedValue * 10) / 10
    : null;
  const goalScaleMax = hasMonthlyGoal
    ? Math.max(goalTargetValue!, projectedValue ?? 0, goalActualValue!) * 1.15
    : 1;
  const goalActualPercent = hasMonthlyGoal
    ? Math.min(((goalActualValue as number) / goalScaleMax) * 100, 100)
    : 0;
  const goalTargetPercent = hasMonthlyGoal
    ? Math.min(((goalTargetValue as number) / goalScaleMax) * 100, 100)
    : 0;
  const goalProjectedPercent =
    hasMonthlyGoal && projectedValue !== null
      ? Math.min((projectedValue / goalScaleMax) * 100, 100)
      : null;
  const formatMonthDay = (isoDate: string) => {
    const [, month, day] = isoDate.split("-");
    return `${Number(month)}月${Number(day)}日`;
  };
  const goalValueOptions =
    goalTypeInput === "questions" ? QUESTION_GOAL_OPTIONS : HOUR_GOAL_OPTIONS;

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="ホーム" />

        {error && <p className="p-4 text-sm text-red-600">{error}</p>}

        {loading || !currentExam ? (
          <p className="p-4 text-sm text-gray-500">読み込み中...</p>
        ) : (
          <main className="flex flex-col gap-4 p-4 md:p-6">
            <RecentExamTabs
              currentExam={currentExam}
              registeredExams={registeredExams}
              onSwitched={handleExamSwitched}
            />

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

            {/* 今月の目標(予測は現在のペースを維持した場合の単純な線形予測)。目標が未設定の場合は設定を促すカードを表示 */}
            {hasMonthlyGoal && monthlyGoalProgress ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">今月の目標</p>
                  <div className="flex items-center gap-2">
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatMonthDay(monthlyGoalProgress.monthStart)}〜
                      {formatMonthDay(monthlyGoalProgress.monthEnd)}
                    </p>
                    <button
                      type="button"
                      onClick={openGoalEditor}
                      className="text-xs font-semibold text-blue-600 underline"
                    >
                      変更
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <TargetGoalIcon className="h-5 w-5 text-blue-500" />
                    <p className="text-[11px] text-gray-500">目標</p>
                    <p className="text-lg font-bold text-gray-900">
                      {goalTargetValue}
                      <span className="text-xs font-medium text-gray-500">{goalUnit}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ClockIcon className="h-5 w-5 text-green-500" />
                    <p className="text-[11px] text-gray-500">現在</p>
                    <p className="text-lg font-bold text-gray-900">
                      {goalActualValue}
                      <span className="text-xs font-medium text-gray-500">{goalUnit}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <TrendUpIcon className="h-5 w-5 text-purple-500" />
                    <p className="text-[11px] text-gray-500">予測</p>
                    <p className="text-lg font-bold text-purple-600">
                      {projectedValue}
                      <span className="text-xs font-medium text-gray-500">{goalUnit}</span>
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 h-2 rounded-full bg-gray-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-blue-600"
                    style={{ width: `${goalActualPercent}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-px border-l border-dashed border-gray-400"
                    style={{ left: `${goalTargetPercent}%` }}
                  />
                  {goalProjectedPercent !== null && (
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-purple-500 shadow"
                      style={{ left: `${goalProjectedPercent}%`, marginLeft: "-5px" }}
                    />
                  )}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>0{goalUnit}</span>
                  <span>
                    {goalTargetValue}
                    {goalUnit}(目標)
                  </span>
                </div>

                <div
                  className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-sm ${
                    monthlyGoalProgress.achievable
                      ? "bg-green-50 text-green-800"
                      : "bg-orange-50 text-orange-800"
                  }`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 shrink-0 ${
                      monthlyGoalProgress.achievable ? "text-green-600" : "text-orange-500"
                    }`}
                  />
                  <span>
                    {monthlyGoalProgress.achievable
                      ? "達成見込み: このペースなら達成できそうです"
                      : "このままのペースだと目標に届かない見込みです"}
                  </span>
                </div>

                {isEditingGoal && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-gray-500">目標の種類</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          label="時間"
                          selected={goalTypeInput === "hours"}
                          onClick={() => {
                            setGoalTypeInput("hours");
                            setGoalValueInput(null);
                          }}
                        />
                        <Chip
                          label="解いた問題数"
                          selected={goalTypeInput === "questions"}
                          onClick={() => {
                            setGoalTypeInput("questions");
                            setGoalValueInput(null);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-gray-500">目標値</p>
                      <div className="flex flex-wrap gap-2">
                        {goalValueOptions.map((v) => (
                          <Chip
                            key={v}
                            label={`${v}${GOAL_TYPE_LABELS[goalTypeInput]}`}
                            selected={goalValueInput === v}
                            onClick={() => setGoalValueInput(v)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={goalValueInput === null || savingGoal}
                        onClick={handleSaveGoal}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingGoal ? "保存中..." : "保存"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingGoal(false)}
                        className="text-xs font-semibold text-gray-500"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        disabled={savingGoal}
                        onClick={handleClearGoal}
                        className="text-xs font-semibold text-red-600 disabled:opacity-40"
                      >
                        目標を削除
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">今月の目標</p>
                  {!isEditingGoal && (
                    <button
                      type="button"
                      onClick={openGoalEditor}
                      className="text-xs font-semibold text-blue-600 underline"
                    >
                      設定する
                    </button>
                  )}
                </div>
                {!isEditingGoal ? (
                  <p className="mt-1 text-sm text-gray-400">
                    今月の学習目標を設定すると、進捗と達成見込みがここに表示されます
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-gray-500">目標の種類</p>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          label="時間"
                          selected={goalTypeInput === "hours"}
                          onClick={() => {
                            setGoalTypeInput("hours");
                            setGoalValueInput(null);
                          }}
                        />
                        <Chip
                          label="解いた問題数"
                          selected={goalTypeInput === "questions"}
                          onClick={() => {
                            setGoalTypeInput("questions");
                            setGoalValueInput(null);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-gray-500">目標値</p>
                      <div className="flex flex-wrap gap-2">
                        {goalValueOptions.map((v) => (
                          <Chip
                            key={v}
                            label={`${v}${GOAL_TYPE_LABELS[goalTypeInput]}`}
                            selected={goalValueInput === v}
                            onClick={() => setGoalValueInput(v)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={goalValueInput === null || savingGoal}
                        onClick={handleSaveGoal}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingGoal ? "保存中..." : "保存"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingGoal(false)}
                        className="text-xs font-semibold text-gray-500"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

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
                <FlagIcon className="h-4 w-4 text-blue-600" />
                <p className="text-base font-bold text-gray-900">苦手分野TOP3</p>
              </div>

              {statsLoading ? (
                <p className="mt-2 text-sm text-gray-400">読み込み中...</p>
              ) : weakAreaTop3.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">データ収集中</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-gray-500">苦手分野を重点的に復習しましょう</p>

                  <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    {/* 全体正答率のドーナツグラフ */}
                    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="12"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={accuracyCircumference}
                          strokeDashoffset={accuracyDashOffset}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <p className="text-xs text-gray-500">全体正答率</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {accuracyPercent}
                          <span className="text-sm font-medium text-gray-500">%</span>
                        </p>
                      </div>
                    </div>

                    <ul className="flex w-full flex-col gap-2.5">
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
                              className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-bold text-white">
                                {index + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between text-sm">
                                  <span className="truncate font-bold text-gray-900">
                                    {c.label}
                                  </span>
                                  <span className="shrink-0 text-xs text-gray-500">
                                    {percent}%({c.correctAnswers}/{c.totalAnswers})
                                  </span>
                                </span>
                                <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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
                  </div>

                  {weakAreaHint && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3">
                      <LightbulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <p className="text-xs text-blue-900">{weakAreaHint}</p>
                    </div>
                  )}

                  <Link
                    href={topWeakAreaHref}
                    className="mt-4 flex w-full items-center justify-center gap-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    対策を始める
                    <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                </>
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
          </main>
        )}
      </div>
    </div>
  );
}
