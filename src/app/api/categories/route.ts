import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/authServerClient";
import { getCurrentUserExam } from "@/lib/csv/userExamRepository";
import { getCategoryMastersByExam } from "@/lib/csv/categoryMasterRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

export interface CategoryMinorOption {
  minorCategory: string;
  details: string[];
}

export interface CategoryMiddleOption {
  middleCategory: string;
  minors: CategoryMinorOption[];
}

export interface CategoryMajorOption {
  majorCategory: string;
  middles: CategoryMiddleOption[];
}

/**
 * 現在の試験の大分類→中分類→小分類→詳細分類の階層一覧を返す(過去問を解く画面の分野指定用)。
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const currentExam = await getCurrentUserExam(userId);
    if (!currentExam) {
      return NextResponse.json(
        { error: "学習対象の試験が未設定です。先に試験を選択してください。" },
        { status: 400 }
      );
    }

    const categoryMasters = await getCategoryMastersByExam(currentExam.exam_id);

    const majorMap = new Map<string, Map<string, Map<string, Set<string>>>>();
    for (const c of categoryMasters) {
      const middleMap =
        majorMap.get(c.major_category) ?? new Map<string, Map<string, Set<string>>>();
      const minorMap = middleMap.get(c.middle_category) ?? new Map<string, Set<string>>();
      const detailSet = minorMap.get(c.minor_category) ?? new Set<string>();
      detailSet.add(c.detail_category);
      minorMap.set(c.minor_category, detailSet);
      middleMap.set(c.middle_category, minorMap);
      majorMap.set(c.major_category, middleMap);
    }

    const categories: CategoryMajorOption[] = Array.from(majorMap.entries()).map(
      ([majorCategory, middleMap]) => ({
        majorCategory,
        middles: Array.from(middleMap.entries()).map(([middleCategory, minorMap]) => ({
          middleCategory,
          minors: Array.from(minorMap.entries()).map(([minorCategory, detailSet]) => ({
            minorCategory,
            details: Array.from(detailSet),
          })),
        })),
      })
    );

    return NextResponse.json({ categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}
