import { NextResponse } from "next/server";

/**
 * APIルートで捕捉した例外をJSONレスポンスへ変換する共通ヘルパー。
 * 例外を握りつぶさず、必ずエラー内容をクライアントへJSONで返す(空レスポンス化を防ぐ)。
 */
export function toErrorResponse(error: unknown, status = 500) {
  console.error(error);
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "サーバー内部でエラーが発生しました",
    },
    { status }
  );
}
