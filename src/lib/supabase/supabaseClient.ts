import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * サーバー側専用のSupabaseクライアント。
 * シークレットキー(SUPABASE_SECRET_KEY)を使うため、
 * クライアントコンポーネント(ブラウザ)から直接importしないこと。
 * API route・サーバー側の処理からのみ利用する。
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL または SUPABASE_SECRET_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  client = createClient(url, key, {
    // サーバー側専用でユーザーセッションを扱わないため、GoTrue(認証)側のバックグラウンド処理は無効化する。
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
