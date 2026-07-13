"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CheckIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

interface FeatureRow {
  label: string;
  free: string;
  premium: string;
}

// 実際にアプリに存在し、プランで差がある(または明示しておきたい)機能のみを掲載する。
const FEATURE_ROWS: FeatureRow[] = [
  { label: "過去問演習", free: "利用可能", premium: "利用可能" },
  {
    label: "AIによる類題生成",
    free: "利用できません",
    premium: "あなたの間違いに合わせてAIが類題を生成",
  },
  { label: "弱点分析・学習アドバイス", free: "利用可能", premium: "利用可能" },
  { label: "利用できるデバイス", free: "Webブラウザ(PC/スマホ)", premium: "Webブラウザ(PC/スマホ)" },
];

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageContent />
    </Suspense>
  );
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [saving, setSaving] = useState<"free" | "paid" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (plan: "free" | "paid") => {
    setSaving(plan);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "プランの設定に失敗しました");
      router.push(from === "mypage" ? "/mypage" : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      setSaving(null);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-50 px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Image
          src="/logo-full.png"
          alt="New Study"
          width={1220}
          height={335}
          priority
          className="h-7 w-auto"
        />

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">プランの比較</h1>
          <p className="text-sm text-gray-500">
            学習スタイルに合わせて、最適なプランをお選びください
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* 無料プラン */}
        <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-lg font-bold text-gray-900">無料プラン</h2>
            <p className="text-xs text-gray-500">まずは気軽に始めたい方へ</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              ¥0<span className="text-sm font-normal text-gray-500"> /月</span>
            </p>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5 border-t border-gray-100 pt-4">
            {FEATURE_ROWS.map((row) => (
              <li key={row.label} className="flex items-start gap-2 text-sm">
                {row.free === "利用できません" ? (
                  <CrossIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                ) : (
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                )}
                <span className="text-gray-700">
                  <span className="font-medium">{row.label}: </span>
                  {row.free}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void handleSelect("free")}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === "free" ? "設定中..." : "無料プランで始める"}
          </button>
        </section>

        {/* プレミアムプラン */}
        <section className="w-full rounded-2xl border-2 border-blue-500 bg-blue-50/40 p-5 shadow-sm">
          <div className="mx-auto -mt-8 mb-2 w-fit rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
            おすすめ
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-lg font-bold text-blue-700">プレミアムプラン</h2>
            <p className="text-xs text-gray-500">AIを活用して効率的に学びたい方へ</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              ¥980<span className="text-sm font-normal text-gray-500"> /月(税込)</span>
            </p>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5 border-t border-blue-100 pt-4">
            {FEATURE_ROWS.map((row) => (
              <li key={row.label} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span className="text-gray-700">
                  <span className="font-medium">{row.label}: </span>
                  {row.premium}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => void handleSelect("paid")}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === "paid" ? "設定中..." : "プレミアムプランにする"}
          </button>
        </section>

        <p className="text-center text-[11px] text-gray-400">
          現在は決済機能を実装していないため、選択するとすぐにプランが切り替わります(実際の課金は発生しません)。いつでもマイページから変更できます。
        </p>
      </div>
    </div>
  );
}
