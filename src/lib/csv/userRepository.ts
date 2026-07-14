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

/**
 * マイページの「通知・リマインド」設定、リスニング問題の表示設定など、
 * users行に対するユーザー単位の設定更新をまとめて扱う。
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<
    Pick<
      User,
      | "review_reminder_enabled"
      | "study_reminder_enabled"
      | "review_reminder_threshold_days"
      | "study_inactivity_threshold_days"
      | "exam_proximity_threshold_days"
      | "listening_show_question_text"
      | "listening_show_choice_text"
      | "listening_show_conversation_text"
      | "plan"
      | "display_name"
    >
  >
): Promise<User> {
  const { data, error } = await getSupabaseClient()
    .from("users")
    .update(settings)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(`updateUserSettings failed: ${error.message}`);
  return UserSchema.parse(data);
}
