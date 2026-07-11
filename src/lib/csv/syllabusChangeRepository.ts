import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { SyllabusChange, SyllabusChangeSchema } from "@/types/syllabusChange";

export async function getAllSyllabusChanges(): Promise<SyllabusChange[]> {
  const { data, error } = await getSupabaseClient()
    .from("syllabus_changes")
    .select("*");
  if (error) throw new Error(`getAllSyllabusChanges failed: ${error.message}`);
  return (data ?? []).map((row) => SyllabusChangeSchema.parse(row));
}

export async function getSyllabusChangesByExamType(
  examType: string
): Promise<SyllabusChange[]> {
  const changes = await getAllSyllabusChanges();
  return changes.filter((c) => c.exam_type === examType);
}

export async function insertSyllabusChange(
  change: SyllabusChange
): Promise<void> {
  const { error } = await getSupabaseClient().from("syllabus_changes").insert(change);
  if (error) throw new Error(`insertSyllabusChange failed: ${error.message}`);
}

/**
 * 変更点の確認状況を更新する(例: 影響を受ける過去問を反映し終えた際に status を "applied" にする)。
 */
export async function updateSyllabusChange(
  change: SyllabusChange
): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from("syllabus_changes")
    .update(change)
    .eq("change_id", change.change_id)
    .select();
  if (error) throw new Error(`updateSyllabusChange failed: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`Syllabus change not found: ${change.change_id}`);
  }
}
