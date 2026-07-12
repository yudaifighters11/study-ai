import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * 全画面共通のログインチェック。未ログインなら/loginへ誘導し、
 * ログイン済みなら/loginへのアクセスをホームへ戻す。
 * セッションの検証・更新はここで必ず行う(Supabase公式の推奨パターン)。
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.includes(request.nextUrl.pathname);
  const isApiPath = request.nextUrl.pathname.startsWith("/api/");

  // APIルートは画面へのリダイレクトではなく、各ルート側で401 JSONを返す(fetch呼び出し側が扱いやすいように)。
  // ここではセッションのCookie更新だけ行い、認証チェック自体は素通りさせる。
  if (isApiPath) {
    return response;
  }

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パスに適用する:
     * - _next/static, _next/image (Next.jsの静的ファイル)
     * - favicon.ico, icon.png (アイコン)
     * - 画像ファイル(public/配下)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|logo-icon.png|logo-full.png).*)",
  ],
};
