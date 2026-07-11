import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
import { User, UserSchema } from "@/types/user";

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`getUserById failed: ${error.message}`);
  return data ? UserSchema.parse(data) : null;
}
