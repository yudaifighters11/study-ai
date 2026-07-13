-- study-ai: TOEICリスニング(音声問題)対応の土台となるスキーマ変更。
-- SQL Editor で実行してください。

-- questionsテーブルに音声問題用の列を追加(既存の過去問には影響しない、両方nullのままでよい)
alter table questions
  add column if not exists audio_url text,
  add column if not exists script_text text;

-- 新しい試験「TOEICリスニング」を追加
insert into exams (exam_id, name, category, display_order, created_at)
values ('toeic_listening', 'TOEICリスニング', '英語・語学系', 4, now())
on conflict (exam_id) do nothing;
