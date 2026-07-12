-- study-ai: マイページの「復習リマインド」「学習リマインド」トグル用のスキーマ変更。
-- SQL Editor で実行してください。

alter table users
  add column if not exists review_reminder_enabled boolean not null default true,
  add column if not exists study_reminder_enabled boolean not null default true;
