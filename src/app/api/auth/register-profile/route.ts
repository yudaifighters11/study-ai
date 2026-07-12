import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/authServerClient";
import { ensureUserProfile } from "@/lib/csv/userRepository";
import { toErrorResponse } from "@/lib/apiErrorHandler";

const RequestSchema = z.object({
  displayName: z.string().min(1).max(50),
});

/**
 * サインアップ直後にクライアントから呼ばれ、自社のusersテーブルへプロフィール行を作成する。
 * Supabase Auth自体のユーザー作成(auth.users)とは別に、表示名を保持するために必要。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力値が不正です", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    await ensureUserProfile({
      user_id: user.id,
      display_name: parsed.data.displayName,
      email: user.email,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
