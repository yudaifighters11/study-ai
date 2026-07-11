import Link from "next/link";

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
    >
      ← ホームに戻る
    </Link>
  );
}
