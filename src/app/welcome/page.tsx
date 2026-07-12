import Link from "next/link";
import { NewStudyLogo } from "@/components/NewStudyLogo";

/**
 * 未ログイン時の初期画面。ロゴ・キャッチコピー・「新しくはじめる」「ログイン」の2択のみを提示する。
 * ここから先(新規登録の詳細フォーム等)は/loginへ遷移して行う。
 */
export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div
        className="flex w-full max-w-sm flex-col items-center gap-8"
        style={{ animation: "fade-in-up 0.6s ease-out" }}
      >
        <NewStudyLogo className="text-6xl sm:text-7xl" />

        <p className="text-center text-sm tracking-[0.08em] text-[#0B1E3D]">
          毎回ちがう、新しい一問を
        </p>

        <div className="flex w-full flex-col gap-3">
          {/*
            TODO: 初回設定画面(受験予定日の入力等のオンボーディング)が別途実装された場合は、
            遷移先を /login?mode=signup からそちらへ変更する。
            現時点では /login の新規登録モードへ直接遷移する。
          */}
          <Link
            href="/login?mode=signup"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-base font-bold text-white shadow-sm transition-all duration-150 hover:brightness-110 hover:shadow-md active:scale-[0.98] active:brightness-95"
          >
            新しくはじめる
          </Link>
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-base font-bold text-[#0B1E3D] shadow-sm transition-colors duration-150 hover:bg-blue-50 active:scale-[0.98]"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
