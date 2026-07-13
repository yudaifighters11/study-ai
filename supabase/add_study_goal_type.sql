-- study-ai: マイページ「今月の目標」を時間以外(解いた問題数)にも対応させるためのスキーマ変更。
-- SQL Editor で実行してください。

alter table user_exams
  rename column monthly_study_goal_hours to monthly_study_goal_value;

alter table user_exams
  add column if not exists monthly_study_goal_type text check (
    monthly_study_goal_type in ('hours', 'questions')
  );
