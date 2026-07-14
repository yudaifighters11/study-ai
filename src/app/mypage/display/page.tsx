import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

/**
 * マイページ「表示設定」画面。
 * 仮実装: 画面の枠(導線)のみで、各項目はまだ機能しない(準備中バッジのみ表示)。
 */

const PLANNED_SETTINGS = [
  {
    label: "リスニングの問題文・選択肢の表示",
    description: "今はクイズ画面内でのみ切り替え可能。ここに集約予定です",
  },
  {
    label: "ダークモード",
    description: "画面全体の配色を切り替えます",
  },
  {
    label: "文字サイズ",
    description: "問題文・選択肢などの文字の大きさを調整します",
  },
];

export default function DisplaySettingsPage() {
  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="表示設定" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← マイページに戻る
          </Link>

          <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {PLANNED_SETTINGS.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 py-1 ${
                  i > 0 ? "border-t border-gray-100 pt-3" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-[11px] text-gray-500">{item.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                  準備中
                </span>
              </div>
            ))}
          </section>

          <p className="text-[11px] text-gray-400">
            この画面はまだ枠のみで、実際の設定はできません。
          </p>
        </main>
      </div>
    </div>
  );
}
