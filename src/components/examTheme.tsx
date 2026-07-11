function IconWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      {children}
    </svg>
  );
}

function ShieldIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </IconWrapper>
  );
}

function MonitorIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </IconWrapper>
  );
}

function BookIcon(props: { className?: string }) {
  return (
    <IconWrapper {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
    </IconWrapper>
  );
}

export interface ExamTheme {
  fg: string;
  solidBg: string;
  // 分野バッジなど、薄い背景色で使う組み合わせ(問題を解く画面で利用)。
  badgeBg: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

// 試験ごとに固定のアイコン・色でテーマ付けする(ホーム画面・分析画面・問題を解く画面で共通利用)。
const EXAM_THEMES: Record<string, ExamTheme> = {
  it_passport: {
    fg: "text-green-600",
    solidBg: "bg-green-600",
    badgeBg: "bg-green-50 text-green-700",
    icon: ShieldIcon,
  },
  toeic_reading: {
    fg: "text-purple-600",
    solidBg: "bg-purple-600",
    badgeBg: "bg-purple-50 text-purple-700",
    icon: BookIcon,
  },
  fe: {
    fg: "text-blue-600",
    solidBg: "bg-blue-600",
    badgeBg: "bg-blue-50 text-blue-700",
    icon: MonitorIcon,
  },
};

export const DEFAULT_EXAM_THEME: ExamTheme = {
  fg: "text-gray-500",
  solidBg: "bg-gray-500",
  badgeBg: "bg-gray-100 text-gray-600",
  icon: BookIcon,
};

export function getExamTheme(examId: string): ExamTheme {
  return EXAM_THEMES[examId] ?? DEFAULT_EXAM_THEME;
}
