import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { CategoryMaster, CategoryMasterSchema } from "@/types/categoryMaster";

export async function getAllCategoryMasters(): Promise<CategoryMaster[]> {
  const supabase = getSupabaseClient();
  const rows = await fetchAllRows<Record<string, unknown>>(([from, to]) =>
    supabase.from("category_master").select("*").range(from, to)
  );
  return rows.map((row) => CategoryMasterSchema.parse(row));
}

export async function getCategoryMastersByExam(
  examId: string
): Promise<CategoryMaster[]> {
  const all = await getAllCategoryMasters();
  return all.filter((c) => c.exam_id === examId);
}

/**
 * 試験ID＋詳細分類から、対応する大分類・中分類・小分類を逆引きする。
 * category_master.csv では同一試験内で detail_category が重複しないことを前提とする。
 */
export async function findCategoryByDetail(
  examId: string,
  detailCategory: string
): Promise<CategoryMaster | null> {
  const list = await getCategoryMastersByExam(examId);
  return list.find((c) => c.detail_category === detailCategory) ?? null;
}

/**
 * 試験ID＋詳細分類から、類題生成の内容プロンプトファイル名を取得する。
 * 該当行が無い、または該当行のprompt_fileが空欄の場合はnullを返す(呼び出し元でdefault.txtにフォールバックする)。
 */
export async function resolvePromptFileByDetail(
  examId: string,
  detailCategory: string | null
): Promise<string | null> {
  if (detailCategory === null) return null;
  const category = await findCategoryByDetail(examId, detailCategory);
  return category?.prompt_file ?? null;
}

/**
 * 試験ID＋詳細分類から、類題生成時に1つの文書を共有させる設問数を取得する。
 * 該当行が無い、またはquestion_set_sizeが空欄の場合は1(単独の設問)を返す。
 */
export async function resolveQuestionSetSize(
  examId: string,
  detailCategory: string | null
): Promise<number> {
  if (detailCategory === null) return 1;
  const category = await findCategoryByDetail(examId, detailCategory);
  return category?.question_set_size ?? 1;
}
