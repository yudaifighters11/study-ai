"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CategoryAnswerTime,
  ConfidentButWrongAnswer,
  MinorCategoryAccuracy,
  MistakeTypeFrequency,
  WeakPointStats,
} from "@/lib/analysis/computeWeakPointStats";
import { MISTAKE_TYPE_LABELS, MistakeType } from "@/types/enums";
import { RegisteredExam } from "@/lib/examPresenter";
import { DEFAULT_EXAM_THEME, getExamTheme } from "@/components/examTheme";

interface AnalysisResponse {
  stats: WeakPointStats;
  advice: string | null;
  adviceError: string | null;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

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

function DocumentIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M6 3h9l3 3v15H6Z" />
      <path d="M9 11h6M9 15h6" />
    </IconWrapper>
  );
}

function ChatIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 5h16v11H8l-4 4Z" />
    </IconWrapper>
  );
}

function RefreshIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </IconWrapper>
  );
}

function TargetIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </IconWrapper>
  );
}

export default function AnalysisPage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<RegisteredExam | null>(null);
  const [otherExams, setOtherExams] = useState<RegisteredExam[]>([]);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [examRes, analysisRes] = await Promise.all([
          fetch("/api/user/exams"),
          fetch("/api/analysis"),
        ]);
        const examData = await examRes.json();
        if (!examRes.ok) throw new Error(examData.error ?? "現在の試験の取得に失敗しました");
        if (!examData.current) {
          router.replace("/exam-select");
          return;
        }
        setCurrentExam(examData.current);
        setOtherExams(
          (examData.registered as RegisteredExam[]).filter((r) => !r.is_current)
        );

        const analysisData = await analysisRes.json();
        if (!analysisRes.ok) throw new Error(analysisData.error ?? "弱点分析の取得に失敗しました");
        setData(analysisData);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const examTheme = currentExam ? getExamTheme(currentExam.exam_id) : DEFAULT_EXAM_THEME;
  const ExamIcon = examTheme.icon;
  const stats = data?.stats ?? null;
  const weakAreaTop3 = stats?.weakAreaTop3 ?? [];

  const weakestLink = (() => {
    const top = weakAreaTop3[0];
    if (!top) return "/study";
    const params = new URLSearchParams(
      top.level === "major" ? { majorCategory: top.label } : { middleCategory: top.label }
    );
    return `/quiz?${params.toString()}`;
  })();

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-6 md:py-5">
          <p className="text-center text-base font-semibold text-gray-900">分析</p>
        </header>

        {loading || !currentExam ? (
          <p className="p-4 text-sm text-gray-500">読み込み中...</p>
        ) : loadError || !stats ? (
          <p className="p-4 text-sm text-red-600">{loadError ?? "データがありません"}</p>
        ) : (
          <main className="flex flex-col gap-4 p-4 md:p-6">
            {/* 現在選択中の試験(切り替えは既存の試験選択画面へ遷移するのみ) */}
            <Link
              href="/exam-select"
              className="flex w-fit min-w-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5"
            >
              <ExamIcon className={`h-5 w-5 shrink-0 ${examTheme.fg}`} />
              <p className="truncate text-base font-bold text-gray-900">{currentExam.name}</p>
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </Link>

            {stats.totalAnswers === 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">
                  まだ回答履歴がありません。過去問を解くと、ここに弱点分析が表示されます。
                </p>
                <Link href="/quiz" className="mt-3 inline-block text-sm text-blue-600 underline">
                  問題を解く
                </Link>
              </section>
            ) : (
              <>
                {/* 弱点分析 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-gray-900">弱点分析</p>
                  <p className="text-xs text-gray-500">現在の試験の理解度を可視化</p>
                  {weakAreaTop3.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-400">データ収集中</p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-3">
                      {weakAreaTop3.map((c, index) => {
                        const percent = Math.round(c.accuracyRate * 100);
                        return (
                          <li key={c.label} className="flex items-center gap-2 text-sm">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-gray-900">
                              {c.label}
                            </span>
                            <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
                              <span
                                className="block h-full rounded-full bg-orange-400"
                                style={{ width: `${percent}%` }}
                              />
                            </span>
                            <span className="w-10 shrink-0 text-right text-xs text-gray-500">
                              {percent}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {/* おすすめアクション */}
                <section>
                  <p className="mb-2 text-xs font-semibold text-gray-500">おすすめアクション</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href={weakestLink}
                      className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm"
                    >
                      <DocumentIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-900">類題演習</span>
                    </Link>
                    <Link
                      href="/study/mistakes"
                      className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm"
                    >
                      <ChatIcon className="h-5 w-5 text-purple-600" />
                      <span className="text-xs font-semibold text-gray-900">AI解説</span>
                    </Link>
                    <Link
                      href="/study"
                      className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 bg-white px-2 py-3 text-center shadow-sm"
                    >
                      <RefreshIcon className="h-5 w-5 text-green-600" />
                      <span className="text-xs font-semibold text-gray-900">復習</span>
                    </Link>
                  </div>
                </section>

                {/* 次にやること */}
                {weakAreaTop3[0] && (
                  <Link
                    href={weakestLink}
                    className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm"
                  >
                    <TargetIcon className="h-6 w-6 shrink-0 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-blue-600">次にやること</p>
                      <p className="truncate text-sm font-bold text-gray-900">
                        {weakAreaTop3[0].label}の基礎確認
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-blue-600" />
                  </Link>
                )}

                {/* 最近の推移 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-bold text-gray-900">最近の推移</p>
                  <p className="text-xs text-gray-500">正答率の推移(直近7日)</p>
                  <div className="mt-3 flex items-end justify-between gap-1.5">
                    {stats.recentTrend.map((point) => {
                      const heightPercent = Math.max(
                        point.totalAnswers === 0 ? 4 : Math.round(point.accuracyRate * 100),
                        4
                      );
                      return (
                        <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                          <div className="flex h-20 w-full items-end">
                            <div
                              className={`w-full rounded-t ${
                                point.totalAnswers === 0 ? "bg-gray-100" : "bg-blue-500"
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{point.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 他の試験 */}
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

                {/* ここから既存の詳細セクション(セクション7-5で必須の項目) */}
                <Section title="論点別正答率(正答率が低い順)">
                  <AccuracyList
                    items={stats.minorCategoryAccuracy
                      .slice(0, 8)
                      .map((t: MinorCategoryAccuracy) => ({ label: t.minorCategory, ...t }))}
                  />
                </Section>

                <Section title="よくあるミス傾向">
                  {stats.mistakeTypeFrequency.length === 0 ? (
                    <EmptyNote text="まだミス傾向のデータがありません。" />
                  ) : (
                    <ul className="flex flex-col gap-1 text-sm text-gray-700">
                      {stats.mistakeTypeFrequency.map((m: MistakeTypeFrequency) => (
                        <li key={m.mistakeType} className="flex justify-between">
                          <span>{MISTAKE_TYPE_LABELS[m.mistakeType as MistakeType]}</span>
                          <span className="text-gray-500">{m.count}件</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="自信ありで間違えた問題">
                  {stats.confidentButWrong.length === 0 ? (
                    <EmptyNote text="該当する問題はありません。" />
                  ) : (
                    <ul className="flex flex-col gap-2 text-sm text-gray-700">
                      {stats.confidentButWrong.slice(0, 5).map((c: ConfidentButWrongAnswer) => (
                        <li key={c.answerId} className="rounded bg-gray-50 p-2">
                          {c.questionText}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="解答時間が長い分野">
                  {stats.categoryAnswerTime.length === 0 ? (
                    <EmptyNote text="データがありません。" />
                  ) : (
                    <ul className="flex flex-col gap-1 text-sm text-gray-700">
                      {stats.categoryAnswerTime.map((c: CategoryAnswerTime) => (
                        <li key={c.category} className="flex justify-between">
                          <span>{c.category}</span>
                          <span className="text-gray-500">
                            平均{Math.round(c.averageAnswerTimeSeconds)}秒({c.sampleCount}問)
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="古い知識による誤答">
                  <p className="text-sm text-gray-700">
                    {stats.outdatedKnowledgeMistakeCount}件のミスに、古い知識・制度変更の影響があった可能性があります。
                  </p>
                </Section>

                <Section title="AIからの学習アドバイス">
                  {data?.advice && <p className="text-sm text-gray-700">{data.advice}</p>}
                  {data?.adviceError && (
                    <p className="text-sm text-red-600">
                      学習アドバイスの生成でエラーが発生しました: {data.adviceError}
                    </p>
                  )}
                  {!data?.advice && !data?.adviceError && (
                    <EmptyNote text="アドバイスを生成できませんでした。" />
                  )}
                </Section>
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-gray-400">{text}</p>;
}

interface AccuracyListItem {
  label: string;
  accuracyRate: number;
  correctAnswers: number;
  totalAnswers: number;
}

function AccuracyList({ items }: { items: AccuracyListItem[] }) {
  if (items.length === 0) {
    return <EmptyNote text="データがありません。" />;
  }
  return (
    <ul className="flex flex-col gap-1 text-sm text-gray-700">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between">
          <span>{item.label}</span>
          <span className="text-gray-500">
            {formatPercent(item.accuracyRate)}({item.correctAnswers}/{item.totalAnswers})
          </span>
        </li>
      ))}
    </ul>
  );
}
