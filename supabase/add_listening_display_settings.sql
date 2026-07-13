-- study-ai: リスニング問題の「問題文」「問の文(選択肢の文)」表示/非表示設定。
-- ユーザーごとに保存し、次回以降も同じ設定を引き継ぐ。
-- SQL Editor で実行してください。

alter table users
  add column if not exists listening_show_question_text boolean not null default true,
  add column if not exists listening_show_choice_text boolean not null default true;
