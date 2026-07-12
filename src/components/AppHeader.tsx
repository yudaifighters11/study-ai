import Image from "next/image";
import Link from "next/link";

/**
 * 全画面共通のヘッダー。左上にNew Studyロゴ(アイコン+文字)を表示する。
 * スクロールしても画面上部に固定表示される(sticky)。
 * ロゴはホーム("/")へのリンク。未ログインの場合はmiddlewareにより初期画面(/welcome)へ導かれる。
 * titleは画面名(スクリーンリーダー向けの見出しとしてのみ使用し、画面には表示しない。
 * 現在の画面は下部のタブバーの選択状態で分かるため)。
 */
export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
      <h1 className="sr-only">{title}</h1>
      <Link href="/" className="inline-block">
        <Image
          src="/logo-full.png"
          alt="New Study"
          width={1220}
          height={335}
          priority
          className="h-7 w-auto"
        />
      </Link>
    </header>
  );
}
