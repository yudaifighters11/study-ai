"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getAuthBrowserClient } from "@/lib/supabase/authBrowserClient";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !submitting && email.trim() && password.trim() && (mode === "login" || displayName.trim());

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
          body: JSON.stringify({ displayName }),
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error ?? "プロフィールの作成に失敗しました");
        }
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
