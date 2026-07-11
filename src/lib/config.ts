/**
 * 本格的なログイン機能は初期スコープ外のため、固定ユーザーIDを使用する。
 * 値はコードへ直接記載せず、環境変数(FIXED_USER_ID)で管理する。
 */
export function getFixedUserId(): string {
  const userId = process.env.FIXED_USER_ID;
  if (!userId) {
    throw new Error(
      "FIXED_USER_ID が設定されていません。.env.local を確認してください。"
    );
  }
  return userId;
}
