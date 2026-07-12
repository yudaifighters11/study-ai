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

/**
 * サインアップ直後、ログインユーザー用のプロフィール行を作成する(既に存在する場合は何もしない)。
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const existing = await getUserById(user.user_id);
  if (existing) return;
  const { error } = await getSupabaseClient().from("users").insert(user);
  if (error) throw new Error(`ensureUserProfile failed: ${error.message}`);
}
