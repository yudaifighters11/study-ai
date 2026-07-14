-- study-ai: リスニング(TOEIC Part3等)の会話文(script_text)表示/非表示設定。
-- 既定はfalse(非表示、これまで通り音声のみ)。ユーザーが選んだ場合のみ表示する。
-- SQL Editor で実行してください。

alter table users
  add column if not exists listening_show_conversation_text boolean not null default false;
