"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

/**
 * マイページ「リマインド」設定画面。復習リマインド・学習リマインドのON/OFFと
 * 日数しきい値(何日経過/未学習/受験日までの残り日数でお知らせするか)を設定する。
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

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={!onChange || disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

type ThresholdField =
  | "review_reminder_threshold_days"
  | "study_inactivity_threshold_days"
  | "exam_proximity_threshold_days";

interface ReminderSettings {
  review_reminder_enabled: boolean;
  study_reminder_enabled: boolean;
  review_reminder_threshold_days: number;
  study_inactivity_threshold_days: number;
  exam_proximity_threshold_days: number;
}

export default function RemindersSettingsPage() {
  const [user, setUser] = useState<ReminderSettings | null>(null);
  const [savingSetting, setSavingSetting] = useState<"review" | "study" | null>(
    null
  );
  const [reviewThresholdInput, setReviewThresholdInput] = useState("");
  const [studyInactivityInput, setStudyInactivityInput] = useState("");
  const [examProximityInput, setExamProximityInput] = useState("");
  const [savingThreshold, setSavingThreshold] = useState<ThresholdField | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setReviewThresholdInput(String(data.user.review_reminder_threshold_days));
        setStudyInactivityInput(String(data.user.study_inactivity_threshold_days));
        setExamProximityInput(String(data.user.exam_proximity_threshold_days));
      }
    };
    void load();
  }, []);

  const handleToggleReminder = async (
    key: "review" | "study",
    nextValue: boolean
  ) => {
    if (!user) return;
    setSavingSetting(key);
    const field =
      key === "review" ? "review_reminder_enabled" : "study_reminder_enabled";
    const prev = user[field];
    setUser({ ...user, [field]: nextValue });
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          key === "review"
            ? { reviewReminderEnabled: nextValue }
            : { studyReminderEnabled: nextValue }
        ),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setUser((current) => (current ? { ...current, [field]: prev } : current));
    } finally {
      setSavingSetting(null);
    }
  };

  const handleThresholdBlur = async (
    field: ThresholdField,
    apiKey: string,
    rawValue: string,
    setInput: (value: string) => void
  ) => {
    if (!user) return;
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value < 1 || value > 60) {
      // 不正な値は保存せず、直前の値に戻す
      setInput(String(user[field]));
      return;
    }
    if (value === user[field]) return;
    setSavingThreshold(field);
    const prev = user[field];
    setUser({ ...user, [field]: value });
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [apiKey]: value }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setUser((current) => (current ? { ...current, [field]: prev } : current));
      setInput(String(prev));
    } finally {
      setSavingThreshold(null);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="リマインド" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← マイページに戻る
          </Link>

          <Card>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                  <RefreshIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    復習リマインド
                  </p>
                  <p className="text-[11px] text-gray-500">
                    不正解のまま解き直していない問題をホーム画面でお知らせします
                  </p>
                </div>
                <ToggleSwitch
                  checked={user?.review_reminder_enabled ?? true}
                  disabled={!user || savingSetting === "review"}
                  onChange={() =>
                    void handleToggleReminder(
                      "review",
                      !(user?.review_reminder_enabled ?? true)
                    )
                  }
                />
              </div>
              <div className="ml-12 flex items-center gap-1.5 text-[11px] text-gray-500">
                <span>不正解のまま</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={reviewThresholdInput}
                  onChange={(e) => setReviewThresholdInput(e.target.value)}
                  onBlur={() =>
                    void handleThresholdBlur(
                      "review_reminder_threshold_days",
                      "reviewReminderThresholdDays",
                      reviewThresholdInput,
                      setReviewThresholdInput
                    )
                  }
                  disabled={
                    !user || savingThreshold === "review_reminder_threshold_days"
                  }
                  className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                />
                <span>日経過したら表示</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                  <BellIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    学習リマインド
                  </p>
                  <p className="text-[11px] text-gray-500">
                    学習が滞っている、または受験日が近いことをホーム画面でお知らせします
                  </p>
                </div>
                <ToggleSwitch
                  checked={user?.study_reminder_enabled ?? true}
                  disabled={!user || savingSetting === "study"}
                  onChange={() =>
                    void handleToggleReminder(
                      "study",
                      !(user?.study_reminder_enabled ?? true)
                    )
                  }
                />
              </div>
              <div className="ml-12 flex flex-col gap-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span>未学習が</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={studyInactivityInput}
                    onChange={(e) => setStudyInactivityInput(e.target.value)}
                    onBlur={() =>
                      void handleThresholdBlur(
                        "study_inactivity_threshold_days",
                        "studyInactivityThresholdDays",
                        studyInactivityInput,
                        setStudyInactivityInput
                      )
                    }
                    disabled={
                      !user ||
                      savingThreshold === "study_inactivity_threshold_days"
                    }
                    className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                  />
                  <span>日続いたら表示</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>受験予定日まで</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={examProximityInput}
                    onChange={(e) => setExamProximityInput(e.target.value)}
                    onBlur={() =>
                      void handleThresholdBlur(
                        "exam_proximity_threshold_days",
                        "examProximityThresholdDays",
                        examProximityInput,
                        setExamProximityInput
                      )
                    }
                    disabled={
                      !user ||
                      savingThreshold === "exam_proximity_threshold_days"
                    }
                    className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                  />
                  <span>日以内になったら表示</span>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
