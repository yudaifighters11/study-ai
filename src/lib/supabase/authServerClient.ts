import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * API route(サーバー側)からログイン中のユーザーを確認するためのSupabaseクライアント。
 * 公開可能なAPIキーのみを使い、Cookie経由でログインセッションを読み取る。
 * データの読み書きには使わず、認証確認専用(データ操作は引き続きsupabaseClient.tsのシークレットキー版を使う)。
 */
export async function getAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component から呼ばれた場合は書き込めないが、
            // middlewareでセッションを更新しているため無視してよい。
          }
        },
      },
    }
  );
}

/**
 * 現在ログイン中のユーザーIDを取得する。未ログインの場合はnull。
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await getAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * 現在ログイン中のユーザーのID・メールアドレスを取得する。未ログインの場合はnull。
 */
export async function getAuthenticatedUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await getAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}
