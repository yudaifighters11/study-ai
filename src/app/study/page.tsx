"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startQuizSession } from "@/lib/quizSession";
import { RegisteredExam } from "@/lib/examPresenter";
import { Chip } from "@/components/Chip";
import { AppHeader } from "@/components/AppHeader";
import { RecentExamTabs } from "@/components/RecentExamTabs";
import type { CategoryMajorOption } from "@/app/api/categories/route";

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 30];
const ALL_VALUE = "";
const ALL_LABEL = "すべて";

// 難易度は1(基礎)〜5(難関)。数字だけでなく意味がわかる表示にする。複数選択可。
const DIFFICULTY_OPTIONS = [
  { value: "1", label: "1 基礎" },
  { value: "2", label: "2 やさしめ" },
  { value: "3", label: "3 標準" },
  { value: "4", label: "4 むずかしめ" },
  { value: "5", label: "5 難関" },
];

function MenuIcon({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

function TagIcon(props: { className?: string }) {
  return (
    <MenuIcon className={props.className}>
      <path d="M11 3H5a2 2 0 0 0-2 2v6a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6-6a1 1 0 0 0 0-1.4l-9-9A1 1 0 0 0 11 3Z" />
      <path d="M7.5 7.5h.01" />
    </MenuIcon>
  );
}

function ChevronRightIcon(props: { className?: string }) {
  return (
    <MenuIcon className={props.className}>
      <path d="M9 6l6 6-6 6" />
    </MenuIcon>
  );
}

const OTHER_MENU_ITEMS = [
  {
    href: "/study/mistakes",
    title: "間違えた問題を確認する",
    description: "これまでの回答履歴から、不正解だった問題を振り返ります。",
    icon: (
      <MenuIcon>
        <path d="M12 4 3 20h18L12 4Z" />
        <path d="M12 10v4" />
        <path d="M12 17h.01" />
      </MenuIcon>
    ),
  },
  {
    href: "/similar-question",
    title: "AI類題を解く",
    description: "直近で生成されたAI類題があれば、続けて解答できます。",
    icon: (
      <MenuIcon>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        <circle cx="12" cy="12" r="5" />
      </MenuIcon>
    ),
  },
  {
    href: "/analysis",
    title: "弱点分析を見る",
    description: "分野別の正答率やミス傾向を確認します。",
    icon: (
      <MenuIcon>
        <path d="M5 19V10M12 19V5M19 19v-6" />
      </MenuIcon>
    ),
  },
];

export default function StudyMenuPage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<RegisteredExam | null>(null);
  const [registeredExams, setRegisteredExams] = useState<RegisteredExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(10);
  const [categories, setCategories] = useState<CategoryMajorOption[]>([]);
  const [majorCategory, setMajorCategory] = useState(ALL_VALUE);
  const [middleCategory, setMiddleCategory] = useState(ALL_VALUE);
  const [minorCategory, setMinorCategory] = useState(ALL_VALUE);
  const [detailCategory, setDetailCategory] = useState(ALL_VALUE);
  // 難易度は複数選択可のため配列で保持する。空配列 = すべて。
  const [difficulty, setDifficulty] = useState<string[]>([]);

  const loadCategories = async () => {
    const categoriesRes = await fetch("/api/categories");
    const categoriesData = await categoriesRes.json();
    if (categoriesRes.ok) setCategories(categoriesData.categories);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [examRes] = await Promise.all([fetch("/api/user/exams"), loadCategories()]);
        const examData = await examRes.json();
        if (examRes.ok) {
          setCurrentExam(examData.current);
          setRegisteredExams(examData.registered ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // 「最近使った」タブで試験を切り替えたときの反映(分野・小分類等の選択肢も切り替え後の試験に合わせて再取得する)。
  const handleExamSwitched = (
    newCurrent: RegisteredExam,
    updatedRegistered: RegisteredExam[]
  ) => {
    setCurrentExam(newCurrent);
    setRegisteredExams(updatedRegistered);
    setMajorCategory(ALL_VALUE);
    setMiddleCategory(ALL_VALUE);
    setMinorCategory(ALL_VALUE);
    setDetailCategory(ALL_VALUE);
    void loadCategories();
  };

  const selectedMajor = categories.find((c) => c.majorCategory === majorCategory);
  const middleOptions = selectedMajor?.middles ?? [];
  const selectedMiddle = middleOptions.find((m) => m.middleCategory === middleCategory);
  const minorOptions = selectedMiddle?.minors ?? [];
  const selectedMinor = minorOptions.find((m) => m.minorCategory === minorCategory);
  const detailOptions = selectedMinor?.details ?? [];

  // シラバス体系を持つ試験は対象シラバスの判定(受験予定日の設定)が必須。
  // シラバス体系を持たない試験(TOEIC等)は、受験予定日がなくても出題可能とする。
  const canStartQuiz = currentExam
    ? currentExam.has_syllabus
      ? !!currentExam.target_syllabus_version
      : true
    : false;

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="学習" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          {!loading && currentExam && (
            <RecentExamTabs
              currentExam={currentExam}
              registeredExams={registeredExams}
              onSwitched={handleExamSwitched}
            />
          )}

          <div className="flex flex-col gap-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <MenuIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600">
                  <path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z" />
                </MenuIcon>
                <div>
                  <p className="text-sm font-semibold text-gray-900">問題を解く</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    対象シラバスで有効な過去問を中心に取り組みます。間違えた問題はAIが類題を生成することもあります。
                  </p>
                </div>
              </div>

              {!canStartQuiz ? (
                <p className="mt-3 text-xs text-gray-500">
                  先にホーム画面で受験予定日を設定してください。
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-gray-500">出題数</p>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_COUNT_OPTIONS.map((count) => (
                        <Chip
                          key={count}
                          label={`${count}問`}
                          selected={questionCount === count}
                          onClick={() => setQuestionCount(count)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-gray-500">
                      難易度(複数選択可)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label={ALL_LABEL}
                        selected={difficulty.length === 0}
                        onClick={() => setDifficulty([])}
                      />
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          selected={difficulty.includes(opt.value)}
                          onClick={() =>
                            setDifficulty((prev) =>
                              prev.includes(opt.value)
                                ? prev.filter((v) => v !== opt.value)
                                : [...prev, opt.value]
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {categories.length > 0 && (
                    <>
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
                          {categories.map((c) => (
                            <Chip
                              key={c.majorCategory}
                              label={c.majorCategory}
                              selected={majorCategory === c.majorCategory}
                              onClick={() => {
                                setMajorCategory(c.majorCategory);
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
                          {middleOptions.map((m) => (
                            <Chip
                              key={m.middleCategory}
                              label={m.middleCategory}
                              selected={middleCategory === m.middleCategory}
                              disabled={majorCategory === ALL_VALUE}
                              onClick={() => {
                                setMiddleCategory(m.middleCategory);
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
                              key={minor.minorCategory}
                              label={minor.minorCategory}
                              selected={minorCategory === minor.minorCategory}
                              disabled={majorCategory === ALL_VALUE || middleCategory === ALL_VALUE}
                              onClick={() => {
                                setMinorCategory(minor.minorCategory);
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
                    </>
                  )}

                  <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <TagIcon className="h-4 w-4 shrink-0" />
                    <span>
                      選択条件　{questionCount}問・難易度
                      {difficulty.length > 0 ? difficulty.join("・") : ALL_LABEL}・
                      {majorCategory || ALL_LABEL}・
                      {middleCategory || ALL_LABEL}・{minorCategory || ALL_LABEL}・
                      {detailCategory || ALL_LABEL}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      startQuizSession(questionCount, {
                        majorCategory: majorCategory || null,
                        middleCategory: middleCategory || null,
                        minorCategory: minorCategory || null,
                        detailCategory: detailCategory || null,
                        difficulty:
                          difficulty.length > 0 ? difficulty.map(Number) : null,
                      });
                      router.push("/quiz");
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    開始する
                  </button>
                  <Link
                    href="/quiz?mode=historical"
                    className="text-center text-xs text-gray-500 underline"
                  >
                    過去の問題を見る(当時のルールで採点)
                  </Link>
                </div>
              )}
            </section>

            {OTHER_MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span className="shrink-0 text-blue-600">{item.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {item.description}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
