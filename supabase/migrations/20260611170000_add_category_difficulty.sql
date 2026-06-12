-- ============================================================
-- Migration: add_category_difficulty
-- Purpose: add category and difficulty columns to prompts (F-16)
-- Tables: prompts
-- ============================================================

-- add category (e.g. coding, writing, analysis, roleplay, other)
alter table public.prompts
  add column if not exists category text;

-- add difficulty (beginner, intermediate, advanced)
alter table public.prompts
  add column if not exists difficulty text;

-- index for community feed filtering by category
create index if not exists idx_prompts_category
  on public.prompts(category)
  where category is not null and deleted_at is null;
