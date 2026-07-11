import { format, isToday, parseISO, subDays } from "date-fns";
import { AnswerHistory } from "@/types/answerHistory";
import { MISTAKE_TYPES, MistakeType } from "@/types/enums";
import { MistakeAnalysis } from "@/types/mistakeAnalysis";
import { Question } from "@/types/question";

/**
 * 弱点分析画面(セクション7-5)向けの集計処理。
 * 正答率・解答時間などの計算はAIを使わない通常の集計処理(セクション5)。
 */

export interface CategoryAccuracy {
  category: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number; // 0.0〜1.0
}

export interface MinorCategoryAccuracy {
  minorCategory: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number;
}

// ホーム画面の「苦手分野TOP3」用。大分類の種類が1つしかない試験(TOEIC等)では、
// 中分類(Part5/6/7等)を代わりに使う。levelでどちらの階層かを示す。
export interface WeakAreaTop3Item {
  label: string;
  level: "major" | "middle";
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number;
}

// 分析画面の「最近の推移」用。直近7日間、日ごとの正答率(回答が無い日は0件として表示)。
export interface DailyAccuracyPoint {
  date: string; // YYYY-MM-DD
  label: string; // 表示用(M/d)
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number;
}

const RECENT_TREND_DAYS = 7;

export interface MistakeTypeFrequency {
  mistakeType: MistakeType;
  count: number;
}

export interface ConfidentButWrongAnswer {
  answerId: string;
  questionId: string;
  questionText: string;
  answeredAt: string;
}

export interface CategoryAnswerTime {
  category: string;
  averageAnswerTimeSeconds: number;
  sampleCount: number;
}

export interface WeakPointStats {
  totalAnswers: number;
  overallAccuracyRate: number;
  categoryAccuracy: CategoryAccuracy[];
  minorCategoryAccuracy: MinorCategoryAccuracy[];
  weakAreaTop3: WeakAreaTop3Item[];
  recentTrend: DailyAccuracyPoint[];
  mistakeTypeFrequency: MistakeTypeFrequency[];
  // 直近のミス分析(最大RECENT_MISTAKE_WINDOW件)に絞ったミス傾向。ホーム画面の「最近多いミス傾向」用。
  recentMistakeTypeFrequency: MistakeTypeFrequency[];
  confidentButWrong: ConfidentButWrongAnswer[];
  categoryAnswerTime: CategoryAnswerTime[];
  outdatedKnowledgeMistakeCount: number;
  // 苦手分野の類題を解くボタン用: 最も正答率の低い大分野(サンプル数が少なすぎる場合はnull)
  weakestCategory: string | null;
  // ホーム画面の「今日解く問題」用
  answeredToday: number;
  correctToday: number;
}

const MIN_SAMPLES_FOR_WEAKEST_CATEGORY = 2;
const RECENT_MISTAKE_WINDOW = 10;

export function computeWeakPointStats(
  answerHistory: AnswerHistory[],
  mistakeAnalyses: MistakeAnalysis[],
  questions: Question[]
): WeakPointStats {
  const questionById = new Map(questions.map((q) => [q.question_id, q]));

  const categoryTotals = new Map<string, { total: number; correct: number }>();
  const middleCategoryTotals = new Map<string, { total: number; correct: number }>();
  const minorCategoryTotals = new Map<string, { total: number; correct: number }>();
  const categoryTimes = new Map<string, number[]>();
  const confidentButWrong: ConfidentButWrongAnswer[] = [];

  let correctCount = 0;

  for (const answer of answerHistory) {
    const question = questionById.get(answer.question_id);
    if (question) {
      const categoryStat = categoryTotals.get(question.major_category) ?? {
        total: 0,
        correct: 0,
      };
      categoryStat.total += 1;
      if (answer.is_correct) categoryStat.correct += 1;
      categoryTotals.set(question.major_category, categoryStat);

      const middleCategoryStat = middleCategoryTotals.get(question.middle_category) ?? {
        total: 0,
        correct: 0,
      };
      middleCategoryStat.total += 1;
      if (answer.is_correct) middleCategoryStat.correct += 1;
      middleCategoryTotals.set(question.middle_category, middleCategoryStat);

      const minorCategoryStat = minorCategoryTotals.get(question.minor_category) ?? {
        total: 0,
        correct: 0,
      };
      minorCategoryStat.total += 1;
      if (answer.is_correct) minorCategoryStat.correct += 1;
      minorCategoryTotals.set(question.minor_category, minorCategoryStat);

      const times = categoryTimes.get(question.major_category) ?? [];
      times.push(answer.answer_time_seconds);
      categoryTimes.set(question.major_category, times);

      if (answer.confidence_level === "confident" && !answer.is_correct) {
        confidentButWrong.push({
          answerId: answer.answer_id,
          questionId: question.question_id,
          questionText: question.question_text,
          answeredAt: answer.answered_at,
        });
      }
    }

    if (answer.is_correct) correctCount += 1;
  }

  const categoryAccuracy: CategoryAccuracy[] = Array.from(
    categoryTotals.entries()
  ).map(([category, stat]) => ({
    category,
    totalAnswers: stat.total,
    correctAnswers: stat.correct,
    accuracyRate: stat.total === 0 ? 0 : stat.correct / stat.total,
  }));

  const middleCategoryAccuracy: CategoryAccuracy[] = Array.from(
    middleCategoryTotals.entries()
  ).map(([category, stat]) => ({
    category,
    totalAnswers: stat.total,
    correctAnswers: stat.correct,
    accuracyRate: stat.total === 0 ? 0 : stat.correct / stat.total,
  }));

  const minorCategoryAccuracy: MinorCategoryAccuracy[] = Array.from(
    minorCategoryTotals.entries()
  )
    .map(([minorCategory, stat]) => ({
      minorCategory,
      totalAnswers: stat.total,
      correctAnswers: stat.correct,
      accuracyRate: stat.total === 0 ? 0 : stat.correct / stat.total,
    }))
    .sort((a, b) => a.accuracyRate - b.accuracyRate);

  const categoryAnswerTime: CategoryAnswerTime[] = Array.from(
    categoryTimes.entries()
  )
    .map(([category, times]) => ({
      category,
      averageAnswerTimeSeconds:
        times.reduce((sum, t) => sum + t, 0) / times.length,
      sampleCount: times.length,
    }))
    .sort((a, b) => b.averageAnswerTimeSeconds - a.averageAnswerTimeSeconds);

  const mistakeTypeCounts = new Map<MistakeType, number>();
  for (const analysis of mistakeAnalyses) {
    mistakeTypeCounts.set(
      analysis.mistake_type,
      (mistakeTypeCounts.get(analysis.mistake_type) ?? 0) + 1
    );
  }
  const mistakeTypeFrequency: MistakeTypeFrequency[] = MISTAKE_TYPES.map(
    (mistakeType) => ({
      mistakeType,
      count: mistakeTypeCounts.get(mistakeType) ?? 0,
    })
  )
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const outdatedKnowledgeMistakeCount = mistakeAnalyses.filter(
    (a) => a.outdated_knowledge_influence
  ).length;

  const recentAnalyses = [...mistakeAnalyses]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, RECENT_MISTAKE_WINDOW);
  const recentMistakeTypeCounts = new Map<MistakeType, number>();
  for (const analysis of recentAnalyses) {
    recentMistakeTypeCounts.set(
      analysis.mistake_type,
      (recentMistakeTypeCounts.get(analysis.mistake_type) ?? 0) + 1
    );
  }
  const recentMistakeTypeFrequency: MistakeTypeFrequency[] = MISTAKE_TYPES.map(
    (mistakeType) => ({
      mistakeType,
      count: recentMistakeTypeCounts.get(mistakeType) ?? 0,
    })
  )
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  let answeredToday = 0;
  let correctToday = 0;
  for (const answer of answerHistory) {
    if (isToday(parseISO(answer.answered_at))) {
      answeredToday += 1;
      if (answer.is_correct) correctToday += 1;
    }
  }

  // 大分類の種類が1つしかない試験(TOEIC等)では、大分類ではなく中分類(Part5/6/7等)を代わりに使う。
  const hasMultipleMajorCategories = categoryAccuracy.length > 1;
  const weakAreaSource = hasMultipleMajorCategories ? categoryAccuracy : middleCategoryAccuracy;
  const weakAreaLevel: "major" | "middle" = hasMultipleMajorCategories ? "major" : "middle";
  const weakAreaTop3: WeakAreaTop3Item[] = weakAreaSource
    .filter((c) => c.totalAnswers >= MIN_SAMPLES_FOR_WEAKEST_CATEGORY)
    .sort((a, b) => a.accuracyRate - b.accuracyRate)
    .slice(0, 3)
    .map((c) => ({
      label: c.category,
      level: weakAreaLevel,
      totalAnswers: c.totalAnswers,
      correctAnswers: c.correctAnswers,
      accuracyRate: c.accuracyRate,
    }));

  // 直近7日間の日ごとの正答率(「最近の推移」用)。回答が無い日は0件として表示する。
  const recentTrend: DailyAccuracyPoint[] = Array.from({ length: RECENT_TREND_DAYS })
    .map((_, i) => subDays(new Date(), RECENT_TREND_DAYS - 1 - i))
    .map((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayAnswers = answerHistory.filter(
        (a) => format(parseISO(a.answered_at), "yyyy-MM-dd") === dateKey
      );
      const correct = dayAnswers.filter((a) => a.is_correct).length;
      return {
        date: dateKey,
        label: format(day, "M/d"),
        totalAnswers: dayAnswers.length,
        correctAnswers: correct,
        accuracyRate: dayAnswers.length === 0 ? 0 : correct / dayAnswers.length,
      };
    });

  const eligibleForWeakest = categoryAccuracy.filter(
    (c) => c.totalAnswers >= MIN_SAMPLES_FOR_WEAKEST_CATEGORY
  );
  const weakestCategory =
    eligibleForWeakest.length === 0
      ? null
      : eligibleForWeakest.reduce((worst, current) =>
          current.accuracyRate < worst.accuracyRate ? current : worst
        ).category;

  return {
    totalAnswers: answerHistory.length,
    overallAccuracyRate:
      answerHistory.length === 0 ? 0 : correctCount / answerHistory.length,
    categoryAccuracy,
    minorCategoryAccuracy,
    weakAreaTop3,
    recentTrend,
    mistakeTypeFrequency,
    recentMistakeTypeFrequency,
    confidentButWrong,
    categoryAnswerTime,
    outdatedKnowledgeMistakeCount,
    weakestCategory,
    answeredToday,
    correctToday,
  };
}
