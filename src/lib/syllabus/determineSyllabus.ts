import { isAfter, isBefore, parseISO } from "date-fns";
import { SyllabusVersion } from "@/types/syllabusVersion";

/**
 * 受験予定日に対応するシラバスバージョンを判定する(AIを使わない通常処理)。
 * セクション6-2の手順1〜2に対応。
 */
export function determineSyllabusForDate(
  targetDate: string,
  syllabusVersions: SyllabusVersion[],
  examType: string
): SyllabusVersion | null {
  const candidates = syllabusVersions.filter((sv) => sv.exam_type === examType);
  const date = parseISO(targetDate);

  const matched = candidates.find((sv) => {
    const validFrom = parseISO(sv.valid_from);
    if (isBefore(date, validFrom)) {
      return false;
    }
    if (sv.valid_until) {
      const validUntil = parseISO(sv.valid_until);
      if (isAfter(date, validUntil)) {
        return false;
      }
    }
    return true;
  });

  if (matched) {
    return matched;
  }

  // 該当する期間の定義が見つからない場合(未来の未定義期間など)は、
  // 現行シラバス(is_current)を暫定的に採用する。
  return candidates.find((sv) => sv.is_current) ?? null;
}
