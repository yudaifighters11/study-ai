/**
 * TOEICリスニング Part2(応答問題)の分類表(ユーザー確定済み、14分類)。
 * questions.middle_categoryにそのまま格納する値。
 */
export const PART2_TOPICS = [
  "WH疑問文",
  "Yes・No疑問文",
  "選択疑問文",
  "付加疑問文",
  "平叙文への応答",
  "依頼・提案",
  "申し出・許可",
  "否定疑問文",
  "間接疑問文",
  "聞き返し・確認",
  "間接的な応答",
  "質問語の聞き分け",
  "類似音・同音異義語",
  "時制・主語の一致",
] as const;

export type Part2Topic = (typeof PART2_TOPICS)[number];

export function isPart2Topic(value: string): value is Part2Topic {
  return (PART2_TOPICS as readonly string[]).includes(value);
}
