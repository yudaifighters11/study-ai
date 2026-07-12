/**
 * NewStudyのロゴ(HTML/CSS/SVGで再現、画像は使用しない)。
 * 「NewStud」は濃いネイビー、末尾の「y」だけ青→水色のグラデーション。
 * 「y」の下から左方向へ伸びるカーブ(SVG)を重ね、学びが続いていく印象を表現する。
 * サイズはフォントサイズ(em)基準で指定しているため、外側でtext-*サイズを指定すれば追従する。
 */
export function NewStudyLogo({ className }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-baseline whitespace-nowrap font-extrabold leading-none tracking-tight ${className ?? ""}`}
    >
      <span className="text-[#0B1E3D]">NewStud</span>
      <span className="relative inline-block">
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #2563EB 0%, #22D3EE 100%)",
          }}
        >
          y
        </span>
        <svg
          viewBox="0 0 120 60"
          preserveAspectRatio="none"
          className="pointer-events-none absolute"
          style={{
            left: "-1.65em",
            top: "0.62em",
            width: "2.9em",
            height: "0.85em",
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ns-swoosh" x1="0%" y1="60%" x2="100%" y2="30%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <path
            d="M 4 12 C 35 52, 75 52, 116 8"
            fill="none"
            stroke="url(#ns-swoosh)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}
