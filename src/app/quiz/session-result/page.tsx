"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import {
  QuizSession,
  clearQuizSession,
  readQuizSession,
  startQuizSession,
} from "@/lib/quizSession";

export default function QuizSessionResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<QuizSession | null>(null);

  useEffect(() => {
    setSession(readQuizSession());
  }, []);

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <BackToHomeLink />
        <p className="mt-3 text-sm text-gray-500">表示できる結果がありません。</p>
      </div>
    );
  }

  const accuracyRate = session.total === 0 ? 0 : session.correctCount / session.total;

  const handleRetry = () => {
    startQuizSession(session.total);
    router.push("/quiz");
  };

  const handleGoHome = () => {
    clearQuizSession();
    router.push("/");
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <BackToHomeLink />

      <div>
        <h1 className="text-xl font-bold sm:text-2xl">お疲れさまでした</h1>
        <p className="mt-2 text-sm text-gray-600">
          {session.total}問中 {session.correctCount}問正解(正答率{Math.round(accuracyRate * 100)}%)
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleRetry}
          className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        >
          もう一度({session.total}問)
        </button>
        <button
          type="button"
          onClick={handleGoHome}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          ホームに戻る
        </button>
      </div>
    </main>
  );
}
