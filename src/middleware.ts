import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 未ログインでもアクセスでき、ログイン済みでもホームへ戻されないパス(規約・プライバシーポリシー等)。
const ALWAYS_PUBLIC_PATHS = ["/terms", "/privacy"];
// 未ログインでもアクセスできるが、ログイン済みならホームへ戻すパス(初期画面・ログイン画面)。
const LOGIN_ONLY_PATHS = ["/welcome", "/login"];

/**
 * 全画面共通のログインチェック。未ログインなら初期画面(/welcome)へ誘導し、
 * ログイン済みなら/welcome・/loginへのアクセスをホームへ戻す。
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

  const isAlwaysPublicPath = ALWAYS_PUBLIC_PATHS.includes(request.nextUrl.pathname);
  const isLoginOnlyPath = LOGIN_ONLY_PATHS.includes(request.nextUrl.pathname);
  const isApiPath = request.nextUrl.pathname.startsWith("/api/");

  // APIルートは画面へのリダイレクトではなく、各ルート側で401 JSONを返す(fetch呼び出し側が扱いやすいように)。
  // ここではセッションのCookie更新だけ行い、認証チェック自体は素通りさせる。
  if (isApiPath) {
    return response;
  }

  if (isAlwaysPublicPath) {
    return response;
  }

  if (!user && !isLoginOnlyPath) {
    const welcomeUrl = new URL("/welcome", request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  if (user && isLoginOnlyPath) {
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
