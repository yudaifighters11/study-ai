"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getAuthBrowserClient } from "@/lib/supabase/authBrowserClient";

/**
 * マイページ「アカウント」設定画面。
 * 表示名・パスワードの変更は実装済み。メールアドレスの変更・アカウントの削除は、
 * この画面に枠(導線)だけ用意し、押すと「準備中です」と表示するのみで実処理は行わない。
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
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </IconWrapper>
  );
}

function MailIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </IconWrapper>
  );
}

function LockIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </IconWrapper>
  );
}

function TrashIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </IconWrapper>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

export default function AccountSettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [showDeleteNotice, setShowDeleteNotice] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) {
        setDisplayName(data.user.display_name);
        setDisplayNameInput(data.user.display_name);
      }
      const {
        data: { user },
      } = await getAuthBrowserClient().auth.getUser();
      setEmail(user?.email ?? null);
    };
    void load();
  }, []);

  const handleSaveName = async () => {
    if (!displayNameInput.trim()) return;
    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayNameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setDisplayName(data.user.display_name);
      setIsEditingName(false);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!email) {
      setPasswordError("メールアドレスが取得できませんでした");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("新しいパスワード(確認)が一致しません");
      return;
    }
    setSavingPassword(true);
    try {
      const supabase = getAuthBrowserClient();
      // 現在のパスワードが正しいことを確認してから変更する
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) throw new Error("現在のパスワードが正しくありません");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw new Error(updateError.message);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "不明なエラーが発生しました");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="アカウント" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← マイページに戻る
          </Link>

          {/* 表示名の変更(実機能) */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                <PersonIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">表示名</p>
                {!isEditingName && (
                  <p className="text-[11px] text-gray-500">{displayName}</p>
                )}
              </div>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => {
                    setDisplayNameInput(displayName);
                    setNameError(null);
                    setIsEditingName(true);
                  }}
                  className="text-[11px] text-blue-600 underline"
                >
                  変更
                </button>
              )}
            </div>
            {isEditingName && (
              <div className="ml-12 flex flex-col gap-2">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  maxLength={50}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={() => void handleSaveName()}
                    className="text-xs font-semibold text-blue-600 disabled:opacity-50"
                  >
                    {savingName ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="text-xs text-gray-500"
                  >
                    キャンセル
                  </button>
                </div>
                {nameError && <p className="text-[11px] text-red-600">{nameError}</p>}
              </div>
            )}
          </Card>

          {/* メールアドレスの変更(枠のみ、未実装) */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                <MailIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">メールアドレス</p>
                <p className="text-[11px] text-gray-500">{email ?? "…"}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailNotice((v) => !v)}
                className="text-[11px] text-blue-600 underline"
              >
                変更
              </button>
            </div>
            {showEmailNotice && (
              <p className="ml-12 text-[11px] text-gray-500">
                この機能は準備中です。現時点ではメールアドレスを変更できません。
              </p>
            )}
          </Card>

          {/* パスワードの変更(実機能) */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                <LockIcon className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">パスワードの変更</p>
            </div>
            <div className="ml-12 flex flex-col gap-2">
              <input
                type="password"
                placeholder="現在のパスワード"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="password"
                placeholder="新しいパスワード(8文字以上)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="password"
                placeholder="新しいパスワード(確認)"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                disabled={
                  savingPassword || !currentPassword || !newPassword || !newPasswordConfirm
                }
                onClick={() => void handleChangePassword()}
                className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {savingPassword ? "変更中..." : "パスワードを変更"}
              </button>
              {passwordError && (
                <p className="text-[11px] text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-[11px] text-green-600">
                  パスワードを変更しました
                </p>
              )}
            </div>
          </Card>

          {/* アカウントの削除(枠のみ、未実装) */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">アカウントの削除</p>
                <p className="text-[11px] text-gray-500">
                  アカウントとすべての学習データを削除します
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteNotice((v) => !v)}
                className="text-[11px] text-red-600 underline"
              >
                削除
              </button>
            </div>
            {showDeleteNotice && (
              <p className="ml-12 text-[11px] text-gray-500">
                この機能は準備中です。現時点ではアカウントを削除できません。
              </p>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
