-- study-ai: TOEICリスニングPart2(応答問題、3択)対応のためのスキーマ変更。
-- SQL Editor で実行してください。

-- Part2は選択肢が3つ(A/B/C)のため、choice_d・choice_d_explanationを必須から任意に変更する。
-- 既存の4択以上の問題(choice_dが既に埋まっている行)には影響しない。
alter table questions
  alter column choice_d drop not null,
  alter column choice_d_explanation drop not null;
