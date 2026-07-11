"use client";

import { CONFIDENCE_LEVELS, CONFIDENCE_LEVEL_LABELS, ConfidenceLevel } from "@/types/enums";

interface ConfidenceSelectorProps {
  value: ConfidenceLevel | null;
  onChange: (value: ConfidenceLevel) => void;
}

/**
 * 自信度の選択(見た目は通常のボタン3択)。セクション11で確定済みの仕様。
 */
export function ConfidenceSelector({ value, onChange }: ConfidenceSelectorProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      {CONFIDENCE_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            value === level
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {CONFIDENCE_LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
