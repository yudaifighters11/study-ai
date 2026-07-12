-- study-ai: サインアップ項目追加(年代・身分・規約同意・目標スコア等)用のスキーマ変更。
-- SQL Editor で実行してください。

alter table users
  add column if not exists age_group text check (
    age_group in ('10s', '20s', '30s', '40s', '50s_plus')
  ),
  add column if not exists occupation text check (
    occupation in ('junior_high', 'high_school', 'university', 'working_adult', 'other')
  ),
  add column if not exists terms_agreed_at timestamptz;

alter table user_exams
  add column if not exists target_score integer;
