-- study-ai: マイページ「学習目標」の今月の目標時間設定用のスキーマ変更。
-- SQL Editor で実行してください。

alter table user_exams
  add column if not exists monthly_study_goal_hours integer;
