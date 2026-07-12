import Image from "next/image";

/**
 * 全画面共通のヘッダー(ロゴアイコン+画面タイトル)。
 */
export function AppHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-6 md:py-5">
      <div className="flex items-center justify-center gap-2">
        <Image
          src="/logo-icon.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0"
        />
        <p className="text-base font-semibold text-gray-900">{title}</p>
      </div>
    </header>
  );
}
