/**
 * TOEICリスニング Part3(会話問題)の分類表(ユーザー確定済み、17分類)。
 * questions.detail_categoryに格納する値。1つの会話(passage_group)を共有する3問は、
 * それぞれ異なるこの分類のいずれかを担当する。
 */
export const PART3_TOPICS = [
  "主旨把握",
  "詳細情報の把握",
  "推論",
  "話し手の意図",
  "次の行動",
  "問題・課題",
  "提案・解決策",
  "理由・目的",
  "場所の特定",
  "職業・立場の特定",
  "話者の関係",
  "予定・時刻",
  "数値・金額",
  "依頼・申し出",
  "発言の言い換え",
  "図表・グラフィック問題",
  "複数話者の情報照合",
] as const;

export type Part3Topic = (typeof PART3_TOPICS)[number];

export function isPart3Topic(value: string): value is Part3Topic {
  return (PART3_TOPICS as readonly string[]).includes(value);
}
