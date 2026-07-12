-- study-ai: Supabase移行用スキーマ(Stage 1)
-- 既存のCSV(data/配下)の列構成・型定義(src/types/配下のZodスキーマ)を基に作成。
-- Supabaseダッシュボードの SQL Editor にそのまま貼り付けて実行してください。
-- 実行順は依存関係(参照先が先)になるよう並べてあります。

-- ============================================================
-- exams.csv
-- ============================================================
create table exams (
  exam_id text primary key,
  name text not null,
  category text not null,
  display_order integer not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- users.csv
-- ============================================================
create table users (
  user_id text primary key,
  display_name text not null,
  email text,
  age_group text check (age_group in ('10s', '20s', '30s', '40s', '50s_plus')),
  occupation text check (occupation in ('junior_high', 'high_school', 'university', 'working_adult', 'other')),
  terms_agreed_at timestamptz,
  review_reminder_enabled boolean not null default true,
  study_reminder_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- user_exams.csv
-- ============================================================
create table user_exams (
  user_id text not null references users(user_id),
  exam_id text not null references exams(exam_id),
  is_current boolean not null default false,
  planned_exam_date date,
  target_syllabus_version text,
  target_score integer,
  monthly_study_goal_hours integer,
  registered_at timestamptz not null default now(),
  last_studied_at timestamptz,
  primary key (user_id, exam_id)
);

-- ============================================================
-- syllabus_versions.csv
-- ============================================================
create table syllabus_versions (
  exam_type text not null references exams(exam_id),
  syllabus_version text not null,
  valid_from date not null,
  valid_until date,
  is_current boolean not null default false,
  description text not null default '',
  change_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exam_type, syllabus_version)
);

-- ============================================================
-- syllabus_changes.csv
-- ============================================================
create table syllabus_changes (
  change_id text primary key,
  exam_type text not null references exams(exam_id),
  syllabus_version text not null,
  change_type text not null check (
    change_type in ('law_added', 'law_removed', 'term_renamed', 'topic_added', 'topic_removed', 'other')
  ),
  description text not null,
  old_term text,
  new_term text,
  affected_topic text,
  effective_date date not null,
  status text not null check (status in ('identified', 'applied')),
  affected_question_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- category_master.csv
-- ============================================================
create table category_master (
  exam_id text not null references exams(exam_id),
  major_category text not null,
  middle_category text not null,
  minor_category text not null,
  detail_category text not null,
  prompt_file text,
  question_set_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exam_id, detail_category)
);

-- ============================================================
-- questions.csv
-- 注: original_question_id は同じ questions テーブルへの自己参照(AI生成問題の元問題)だが、
-- 取込順序に依存させないため外部キー制約は付けていない(値の整合性はアプリ側で担保)。
-- ============================================================
create table questions (
  question_id text primary key,
  exam_type text not null references exams(exam_id),
  question_type text not null check (question_type in ('original', 'ai_generated')),
  original_question_id text,
  question_text text not null,
  passage_text text,
  passage_group_id text,
  passage_order integer,
  passage_total_questions integer,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  choice_e text,
  choice_f text,
  choice_g text,
  choice_h text,
  original_correct_choice text not null check (original_correct_choice in ('a','b','c','d','e','f','g','h')),
  current_correct_choice text not null check (current_correct_choice in ('a','b','c','d','e','f','g','h')),
  original_explanation text not null,
  current_explanation text not null,
  choice_a_explanation text not null,
  choice_b_explanation text not null,
  choice_c_explanation text not null,
  choice_d_explanation text not null,
  choice_e_explanation text,
  choice_f_explanation text,
  choice_g_explanation text,
  choice_h_explanation text,
  major_category text not null,
  middle_category text not null,
  minor_category text not null,
  detail_category text,
  related_terms text[] not null default '{}',
  difficulty integer not null check (difficulty between 1 and 5),
  target_mistake_type text check (
    target_mistake_type in (
      'knowledge_gap', 'term_confusion', 'misread_question',
      'wrong_after_narrowing_to_two', 'confident_but_wrong', 'repeated_topic_mistake'
    )
  ),
  source_year integer not null,
  syllabus_version text not null,
  valid_from date not null,
  valid_until date,
  is_current boolean not null default true,
  is_current_exam_scope boolean not null default true,
  revision_note text not null default '',
  validation_status text not null check (
    validation_status in ('not_applicable', 'pending', 'passed', 'failed', 'reported')
  ),
  rule_reference_date date not null,
  similar_question_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_exam_type_idx on questions(exam_type);
create index questions_passage_group_id_idx on questions(passage_group_id);

-- ============================================================
-- answer_history.csv
-- ============================================================
create table answer_history (
  answer_id text primary key,
  user_id text not null references users(user_id),
  question_id text not null references questions(question_id),
  selected_choice text not null check (selected_choice in ('a','b','c','d','e','f','g','h')),
  evaluated_correct_choice text not null check (evaluated_correct_choice in ('a','b','c','d','e','f','g','h')),
  is_correct boolean not null,
  answer_time_seconds numeric not null,
  confidence_level text check (confidence_level in ('confident', 'unsure', 'unknown')),
  self_reported_mistake_reason text not null default '',
  syllabus_version text not null,
  evaluation_date timestamptz not null,
  answered_at timestamptz not null default now()
);

create index answer_history_user_id_idx on answer_history(user_id);
create index answer_history_question_id_idx on answer_history(question_id);

-- ============================================================
-- mistake_analyses.csv
-- ============================================================
create table mistake_analyses (
  analysis_id text primary key,
  user_id text not null references users(user_id),
  answer_id text not null references answer_history(answer_id),
  question_id text not null references questions(question_id),
  mistake_type text not null check (
    mistake_type in (
      'knowledge_gap', 'term_confusion', 'misread_question',
      'wrong_after_narrowing_to_two', 'confident_but_wrong', 'repeated_topic_mistake'
    )
  ),
  confused_concepts text[] not null default '{}',
  analysis_comment text not null,
  recommended_training text not null,
  confidence_score numeric not null check (confidence_score between 0 and 1),
  outdated_knowledge_influence boolean not null default false,
  syllabus_version text not null,
  created_at timestamptz not null default now()
);

create index mistake_analyses_user_id_idx on mistake_analyses(user_id);

-- ============================================================
-- question_reports.csv
-- ============================================================
create table question_reports (
  report_id text primary key,
  user_id text not null references users(user_id),
  question_id text not null references questions(question_id),
  reason text not null check (
    reason in ('incorrect_answer', 'unclear_question', 'inappropriate_content', 'other')
  ),
  comment text not null default '',
  created_at timestamptz not null default now()
);
