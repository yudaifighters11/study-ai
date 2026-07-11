import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { SyllabusVersion, SyllabusVersionSchema } from "@/types/syllabusVersion";

export async function getAllSyllabusVersions(): Promise<SyllabusVersion[]> {
  const { data, error } = await getSupabaseClient()
    .from("syllabus_versions")
    .select("*");
  if (error) throw new Error(`getAllSyllabusVersions failed: ${error.message}`);
  return (data ?? []).map((row) => SyllabusVersionSchema.parse(row));
}

export async function getCurrentSyllabusVersion(
  examType: string
): Promise<SyllabusVersion | null> {
  const versions = await getAllSyllabusVersions();
  return versions.find((v) => v.exam_type === examType && v.is_current) ?? null;
}
