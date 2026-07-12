"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabDef {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  isActive: (pathname: string) => boolean;
}

function TabIcon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

const TABS: TabDef[] = [
  {
    href: "/",
    label: "ホーム",
    isActive: (pathname) => pathname === "/",
    icon: (active) => (
      <TabIcon active={active}>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9h12v-9" />
      </TabIcon>
    ),
  },
  {
    href: "/study",
    label: "学習",
    isActive: (pathname) =>
      pathname.startsWith("/study") ||
      pathname.startsWith("/quiz") ||
      pathname.startsWith("/similar-question"),
    icon: (active) => (
      <TabIcon active={active}>
        <path d="M4 5h11a3 3 0 0 1 3 3v11" />
        <path d="M4 5v13a2 2 0 0 0 2 2h12" />
        <path d="M4 5c0-1.1.9-2 2-2h2" />
      </TabIcon>
    ),
  },
  {
    href: "/analysis",
    label: "分析",
    isActive: (pathname) => pathname.startsWith("/analysis"),
    icon: (active) => (
      <TabIcon active={active}>
        <path d="M5 19V10M12 19V5M19 19v-6" />
      </TabIcon>
    ),
  },
  {
    href: "/mypage",
    label: "マイページ",
    isActive: (pathname) => pathname.startsWith("/mypage"),
    icon: (active) => (
      <TabIcon active={active}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
      </TabIcon>
    ),
  },
];

/**
 * 全画面共通のボトムタブナビゲーション。マイページは中身のないプレースホルダー画面。
 */
export function BottomTabBar() {
  const pathname = usePathname();

  // 未ログイン時の画面(初期画面・ログイン/新規登録画面)はアプリのナビゲーションを持たないため表示しない。
  if (pathname === "/welcome" || pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center border-t border-gray-200 bg-white">
      <div className="grid w-full max-w-[430px] md:max-w-2xl grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
