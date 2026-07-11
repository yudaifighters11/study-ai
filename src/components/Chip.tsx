"use client";

/**
 * チップ選択式UI(学習メニュー画面・間違えた問題画面の分野絞り込みなど)で共通利用するボタン。
 */
export function Chip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-gray-300 bg-white text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
