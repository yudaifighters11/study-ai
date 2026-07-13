import { CHOICE_KEYS, ChoiceKey } from "@/types/enums";

/**
 * 選択肢テキストを持つ最小限の形。
 * a〜cは必須、d〜hは未使用の場合null(空欄、TOEICリスニングPart2等の3択問題ではdもnull)。
 */
export interface ChoiceTextBearing {
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string | null;
  choice_e: string | null;
  choice_f: string | null;
  choice_g: string | null;
  choice_h: string | null;
}

export interface ChoiceExplanationBearing {
  choice_a_explanation: string;
  choice_b_explanation: string;
  choice_c_explanation: string;
  choice_d_explanation: string | null;
  choice_e_explanation: string | null;
  choice_f_explanation: string | null;
  choice_g_explanation: string | null;
  choice_h_explanation: string | null;
}

function choiceTextMap(source: ChoiceTextBearing): Record<ChoiceKey, string | null> {
  return {
    a: source.choice_a,
    b: source.choice_b,
    c: source.choice_c,
    d: source.choice_d,
    e: source.choice_e,
    f: source.choice_f,
    g: source.choice_g,
    h: source.choice_h,
  };
}

function choiceExplanationMap(
  source: ChoiceExplanationBearing
): Record<ChoiceKey, string | null> {
  return {
    a: source.choice_a_explanation,
    b: source.choice_b_explanation,
    c: source.choice_c_explanation,
    d: source.choice_d_explanation,
    e: source.choice_e_explanation,
    f: source.choice_f_explanation,
    g: source.choice_g_explanation,
    h: source.choice_h_explanation,
  };
}

/**
 * 実際に使われている(空欄でない)選択肢キーの一覧を、a→hの順で返す。
 * 4択の問題ならa〜dだけが返る。
 */
export function getActiveChoiceKeys(source: ChoiceTextBearing): ChoiceKey[] {
  const map = choiceTextMap(source);
  return CHOICE_KEYS.filter((key) => {
    const value = map[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function getChoiceText(
  source: ChoiceTextBearing,
  key: ChoiceKey
): string {
  return choiceTextMap(source)[key] ?? "";
}

export function getChoiceExplanation(
  source: ChoiceExplanationBearing,
  key: ChoiceKey
): string {
  return choiceExplanationMap(source)[key] ?? "";
}
