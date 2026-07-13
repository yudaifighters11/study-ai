-- study-ai: プランによる機能制限(AI類題生成の可否)の土台。
-- 決済機能はまだ実装しないため、planは手動切り替え(マイページの簡易トグル)で変更する。
-- SQL Editor で実行してください。

alter table users
  add column if not exists plan text not null default 'free' check (plan in ('free', 'paid'));
