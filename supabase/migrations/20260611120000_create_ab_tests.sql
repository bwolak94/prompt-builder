-- ============================================================
-- Migration: create_ab_tests
-- Purpose: Store A/B test sessions and results for F-03
-- Tables: ab_tests
-- ============================================================

create table if not exists public.ab_tests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  prompt_id    uuid not null references public.prompts(id) on delete cascade,

  -- snapshot of both variants at test creation time
  variant_a    jsonb not null,  -- { blocks: PromptBlock[], content_md: string }
  variant_b    jsonb not null,  -- { blocks: PromptBlock[], content_md: string } (user-editable clone)

  -- ai scoring results (nullable — may be offline only or not yet scored)
  score_a      jsonb,           -- { overall_score, scores, feedback, provider }
  score_b      jsonb,

  -- live run responses (nullable — only populated when live mode used)
  response_a   text,
  response_b   text,
  model_used   text,

  -- resolution metadata
  winner       text check (winner in ('a', 'b', 'tie')),
  status       text not null default 'draft'
               check (status in ('draft', 'scored', 'ran', 'resolved')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

-- index for efficient per-prompt listing
create index if not exists idx_ab_tests_prompt_id
  on public.ab_tests(prompt_id, created_at desc);

create index if not exists idx_ab_tests_user_id
  on public.ab_tests(user_id, created_at desc);

-- enable RLS
alter table public.ab_tests enable row level security;

-- select: only own tests
create policy "ab_tests_select_own"
  on public.ab_tests for select to authenticated
  using (auth.uid() = user_id);

-- insert: only own tests
create policy "ab_tests_insert_own"
  on public.ab_tests for insert to authenticated
  with check (auth.uid() = user_id);

-- update: only own tests
create policy "ab_tests_update_own"
  on public.ab_tests for update to authenticated
  using (auth.uid() = user_id);

-- delete: only own tests
create policy "ab_tests_delete_own"
  on public.ab_tests for delete to authenticated
  using (auth.uid() = user_id);
