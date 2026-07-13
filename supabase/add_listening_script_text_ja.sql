-- study-ai: TOEICリスニング問題の日本語訳を保存するための列を追加。
-- 画面にはまだ表示しない(将来、表示機能を作る際に使う)。
-- SQL Editor で実行してください。

alter table questions
  add column if not exists script_text_ja text;
