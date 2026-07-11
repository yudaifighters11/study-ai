-- study-ai: SupabaseのAPI(PostgREST)からテーブルへアクセスできるようにする権限付与。
-- SQLで直接 CREATE TABLE すると、Supabase標準のAPI用ロールへの権限が自動では付与されないため、
-- schema.sql 実行後に、これも SQL Editor で実行してください。
--
-- 今回は「シークレットキーのみサーバー側で使用し、公開可能なAPIキー(anon)はブラウザから使わない」
-- 構成のため、service_role にのみ権限を付与する。

grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.exams,
  public.users,
  public.user_exams,
  public.syllabus_versions,
  public.syllabus_changes,
  public.category_master,
  public.questions,
  public.answer_history,
  public.mistake_analyses,
  public.question_reports
to service_role;

-- 今後このスキーマに新しいテーブルを追加した場合も、自動でservice_roleに権限が付与されるようにする。
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
