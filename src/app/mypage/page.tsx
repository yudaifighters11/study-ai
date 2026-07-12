"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getExamTheme } from "@/components/examTheme";
import { AppHeader } from "@/components/AppHeader";
import { getAuthBrowserClient } from "@/lib/supabase/authBrowserClient";

/**
 * マイページ画面。プロフィール(表示名・ログアウト)は実データ・実機能。
 * それ以外(学習中の試験・学習目標・通知設定・設定)は仮の値で、
 * 実際の学習データや設定とは連動していない(見た目の骨組みのみのプレースホルダー実装)。
 */

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

function PersonIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </IconWrapper>
  );
}

function TargetIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </IconWrapper>
  );
}

function CalendarIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
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

function RefreshIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 10a8 8 0 0 1 14-4.9M20 14a8 8 0 0 1-14 4.9" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </IconWrapper>
  );
}

function BellIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </IconWrapper>
  );
}

function MegaphoneIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l7 4V5l-7 4H4a1 1 0 0 0-1 1Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </IconWrapper>
  );
}

function SunIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </IconWrapper>
  );
}

function BookIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
    </IconWrapper>
  );
}

function HelpIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.5" />
      <path d="M12 17.2h.01" />
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

function InfoIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </IconWrapper>
  );
}

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-gray-900">{children}</p>;
}

const STUDYING_EXAMS = [
  { examId: "it_passport", name: "ITパスポート" },
  { examId: "fe", name: "基本情報技術者" },
  { examId: "toeic_reading", name: "TOEIC" },
];

const SETTINGS_ROWS = [
  { icon: PersonIcon, label: "アカウント" },
  { icon: SunIcon, label: "表示設定" },
  { icon: BookIcon, label: "学習設定" },
  { icon: HelpIcon, label: "ヘルプ" },
];

interface CurrentUser {
  display_name: string;
  email: string | null;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) setUser(data.user);
    };
    void load();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await getAuthBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="マイページ" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          {/* プロフィール(実データ) */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <PersonIcon className="h-7 w-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">
                  {user ? `${user.display_name}さん` : "読み込み中..."}
                </p>
                <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
              </div>
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
              >
                {loggingOut ? "..." : "ログアウト"}
              </button>
            </div>
          </Card>

          {/* 学習中の試験(仮の値) */}
          <Card>
            <CardTitle>学習中の試験</CardTitle>
            <div className="flex flex-wrap gap-2">
              {STUDYING_EXAMS.map((exam) => {
                const theme = getExamTheme(exam.examId);
                const ExamIcon = theme.icon;
                return (
                  <span
                    key={exam.examId}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800"
                  >
                    <ExamIcon className={`h-4 w-4 ${theme.fg}`} />
                    {exam.name}
                  </span>
                );
              })}
            </div>
          </Card>

          {/* 学習目標(仮の値) */}
          <Card>
            <CardTitle>学習目標</CardTitle>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <TargetIcon className="h-3.5 w-3.5" />
                  今月の目標
                </span>
                <p className="text-lg font-bold text-gray-900">
                  20<span className="text-xs font-medium text-gray-500">時間</span>
                </p>
                <p className="text-[11px] text-gray-400">/ 30時間</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  週間学習日数
                </span>
                <p className="text-lg font-bold text-gray-900">
                  5<span className="text-xs font-medium text-gray-500">日</span>
                </p>
                <p className="text-[11px] text-gray-400">/ 7日</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <FlagIcon className="h-3.5 w-3.5" />
                  受験予定
                </span>
                <p className="text-sm font-bold text-gray-900">2025/11/15</p>
                <p className="text-[11px] text-gray-400">ITパスポート</p>
              </div>
            </div>
          </Card>

          {/* 通知・リマインド(仮の値、操作不可) */}
          <Card>
            <CardTitle>通知・リマインド</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                  <RefreshIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    復習リマインド
                  </p>
                  <p className="text-[11px] text-gray-500">
                    忘却曲線に基づいてお知らせします
                  </p>
                </div>
                <ToggleSwitch checked />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                  <BellIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    学習リマインド
                  </p>
                  <p className="text-[11px] text-gray-500">
                    毎日の学習をサポートします
                  </p>
                </div>
                <ToggleSwitch checked />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                  <MegaphoneIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">お知らせ</p>
                  <p className="text-[11px] text-gray-500">
                    キャンペーンや新機能をお知らせします
                  </p>
                </div>
                <ToggleSwitch checked={false} />
              </div>
            </div>
          </Card>

          {/* 設定(仮のリンク、遷移なし) */}
          <Card>
            <CardTitle>設定</CardTitle>
            <div className="flex flex-col">
              {SETTINGS_ROWS.map((row, i) => {
                const RowIcon = row.icon;
                return (
                  <div
                    key={row.label}
                    className={`flex items-center gap-3 py-2.5 ${
                      i > 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <RowIcon className="h-4 w-4 text-gray-400" />
                    <p className="flex-1 text-sm text-gray-800">{row.label}</p>
                    <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 開発中であることの案内 */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>今後、受験予定日や各種設定をここで管理できます</p>
          </div>
        </main>
      </div>
    </div>
  );
}
