-- study-ai: TOEICリスニング Part3(会話問題)の図表問題対応。
-- 価格表・スケジュール等をJSON文字列(headers/rows)で保持する。画像は使用しない。
-- SQL Editor で実行してください。

alter table questions
  add column if not exists graphic_table text;
