import Image from "next/image";

/**
 * 全画面共通のヘッダー。左上にStudyAIロゴ(アイコン+文字)を表示する。
 * titleは画面名(スクリーンリーダー向けの見出しとしてのみ使用し、画面には表示しない。
 * 現在の画面は下部のタブバーの選択状態で分かるため)。
 */
export function AppHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
      <h1 className="sr-only">{title}</h1>
      <Image
        src="/logo-full.png"
        alt="StudyAI"
        width={1285}
        height={350}
        priority
        className="h-7 w-auto"
      />
    </header>
  );
}
