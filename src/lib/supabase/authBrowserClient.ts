"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * ログイン画面(クライアントコンポーネント)専用のSupabaseクライアント。
 * 公開可能なAPIキーのみを使う(シークレットキーは絶対にここへ持ち込まない)。
 * データの読み書き(質問・回答履歴など)には使わず、認証(サインアップ・ログイン・ログアウト)専用。
 */
export function getAuthBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
