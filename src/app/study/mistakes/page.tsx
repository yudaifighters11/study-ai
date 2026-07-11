"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { Chip } from "@/components/Chip";
import type { MistakeListItem } from "@/app/api/mistakes/route";

const ALL_VALUE = "";
const ALL_LABEL = "すべて";

export default function MistakesPage() {
  const [items, setItems] = useState<MistakeListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [majorCategory, setMajorCategory] = useState(ALL_VALUE);
  const [middleCategory, setMiddleCategory] = useState(ALL_VALUE);
  const [minorCategory, setMinorCategory] = useState(ALL_VALUE);
  const [detailCategory, setDetailCategory] = useState(ALL_VALUE);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/mistakes");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // 分野の絞り込み候補は、実際に間違えた問題に存在する分野のみから作る(存在しない分野は表示しない)。
  const majorOptions = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.majorCategory)));
  }, [items]);

  const middleOptions = useMemo(() => {
    if (!items || majorCategory === ALL_VALUE) return [];
    return Array.from(
      new Set(
        items
          .filter((i) => i.majorCategory === majorCategory)
          .map((i) => i.middleCategory)
      )
    );
  }, [items, majorCategory]);

  const minorOptions = useMemo(() => {
    if (!items || majorCategory === ALL_VALUE || middleCategory === ALL_VALUE) return [];
    return Array.from(
      new Set(
        items
          .filter(
            (i) => i.majorCategory === majorCategory && i.middleCategory === middleCategory
          )
          .map((i) => i.minorCategory)
      )
    );
  }, [items, majorCategory, middleCategory]);

  const detailOptions = useMemo(() => {
    if (
      !items ||
      majorCategory === ALL_VALUE ||
      middleCategory === ALL_VALUE ||
      minorCategory === ALL_VALUE
    )
      return [];
    return Array.from(
      new Set(
        items
          .filter(
            (i) =>
              i.majorCategory === majorCategory &&
              i.middleCategory === middleCategory &&
              i.minorCategory === minorCategory &&
              i.detailCategory !== null
          )
          .map((i) => i.detailCategory as string)
      )
    );
  }, [items, majorCategory, middleCategory, minorCategory]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(
      (i) =>
        (majorCategory === ALL_VALUE || i.majorCategory === majorCategory) &&
        (middleCategory === ALL_VALUE || i.middleCategory === middleCategory) &&
        (minorCategory === ALL_VALUE || i.minorCategory === minorCategory) &&
        (detailCategory === ALL_VALUE || i.detailCategory === detailCategory)
    );
  }, [items, majorCategory, middleCategory, minorCategory, detailCategory]);

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-6 md:py-5">
          <p className="text-center text-base font-semibold text-gray-900">
            間違えた問題
          </p>
        </header>

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <BackToHomeLink />

          {loading && <p className="text-sm text-gray-500">読み込み中...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && items && items.length === 0 && (
            <div>
              <p className="text-sm text-gray-500">
                現在の試験で不正解だった問題はまだありません。
              </p>
              <Link href="/quiz" className="mt-3 inline-block text-sm text-blue-600 underline">
                問題を解く
              </Link>
            </div>
          )}

          {!loading && !error && items && items.length > 0 && (
            <>
              <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">大分類</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      label={ALL_LABEL}
                      selected={majorCategory === ALL_VALUE}
                      onClick={() => {
                        setMajorCategory(ALL_VALUE);
                        setMiddleCategory(ALL_VALUE);
                        setMinorCategory(ALL_VALUE);
                        setDetailCategory(ALL_VALUE);
                      }}
                    />
                    {majorOptions.map((major) => (
                      <Chip
                        key={major}
                        label={major}
                        selected={majorCategory === major}
                        onClick={() => {
                          setMajorCategory(major);
                          setMiddleCategory(ALL_VALUE);
                          setMinorCategory(ALL_VALUE);
                          setDetailCategory(ALL_VALUE);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">中分類</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      label={ALL_LABEL}
                      selected={middleCategory === ALL_VALUE}
                      disabled={majorCategory === ALL_VALUE}
                      onClick={() => {
                        setMiddleCategory(ALL_VALUE);
                        setMinorCategory(ALL_VALUE);
                        setDetailCategory(ALL_VALUE);
                      }}
                    />
                    {middleOptions.map((middle) => (
                      <Chip
                        key={middle}
                        label={middle}
                        selected={middleCategory === middle}
                        disabled={majorCategory === ALL_VALUE}
                        onClick={() => {
                          setMiddleCategory(middle);
                          setMinorCategory(ALL_VALUE);
                          setDetailCategory(ALL_VALUE);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">小分類</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      label={ALL_LABEL}
                      selected={minorCategory === ALL_VALUE}
                      disabled={majorCategory === ALL_VALUE || middleCategory === ALL_VALUE}
                      onClick={() => {
                        setMinorCategory(ALL_VALUE);
                        setDetailCategory(ALL_VALUE);
                      }}
                    />
                    {minorOptions.map((minor) => (
                      <Chip
                        key={minor}
                        label={minor}
                        selected={minorCategory === minor}
                        disabled={majorCategory === ALL_VALUE || middleCategory === ALL_VALUE}
                        onClick={() => {
                          setMinorCategory(minor);
                          setDetailCategory(ALL_VALUE);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-500">詳細分類</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      label={ALL_LABEL}
                      selected={detailCategory === ALL_VALUE}
                      disabled={
                        majorCategory === ALL_VALUE ||
                        middleCategory === ALL_VALUE ||
                        minorCategory === ALL_VALUE
                      }
                      onClick={() => setDetailCategory(ALL_VALUE)}
                    />
                    {detailOptions.map((detail) => (
                      <Chip
                        key={detail}
                        label={detail}
                        selected={detailCategory === detail}
                        disabled={
                          majorCategory === ALL_VALUE ||
                          middleCategory === ALL_VALUE ||
                          minorCategory === ALL_VALUE
                        }
                        onClick={() => setDetailCategory(detail)}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <p className="text-xs text-gray-500">{filteredItems.length}件表示中</p>

              {filteredItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  条件に一致する間違えた問題はありません。
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {filteredItems.map((item) => (
                    <li
                      key={item.answerId}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm font-medium leading-relaxed text-gray-900">
                        {item.questionText}
                      </p>
                      <p className="mt-2 text-xs text-red-600">
                        あなたの回答: {item.selectedChoiceText}
                      </p>
                      <p className="text-xs text-green-700">
                        正解: {item.correctChoiceText}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(item.answeredAt).toLocaleString("ja-JP")}
                      </p>
                      {item.aiAnalysis && (
                        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-blue-900">
                            AIによるミス原因分析: {item.aiAnalysis.mistakeTypeLabel}
                          </p>
                          {item.aiAnalysis.confusedConcepts.length > 0 && (
                            <p className="mt-1 text-xs text-blue-900">
                              混同している可能性: {item.aiAnalysis.confusedConcepts.join("、")}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-blue-900">
                            {item.aiAnalysis.analysisComment}
                          </p>
                          <p className="mt-1 text-xs text-blue-900">
                            次に行うべき学習: {item.aiAnalysis.recommendedTraining}
                          </p>
                        </div>
                      )}
                      <Link
                        href={`/quiz?questionId=${encodeURIComponent(item.questionId)}`}
                        className="mt-3 flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-semibold text-white"
                      >
                        この問題を解き直す
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
