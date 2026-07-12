-- study-ai: リマインドの日数しきい値をユーザー設定可能にするためのスキーマ変更。
-- SQL Editor で実行してください。

alter table users
  add column if not exists review_reminder_threshold_days integer not null default 3,
  add column if not exists study_inactivity_threshold_days integer not null default 3,
  add column if not exists exam_proximity_threshold_days integer not null default 7;
