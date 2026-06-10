-- =============================================================================
-- Migration: 20260610000005_create_prompt_ratings
-- Purpose:   Create the `prompt_ratings` table that stores AI scoring results
--            (clarity, specificity, structure, tone, completeness) produced
--            by the /api/score endpoint.
-- Affected:  public.prompt_ratings
-- Dependencies: public.prompts (migration 003)
-- Date:      2026-06-10
-- =============================================================================

create table public.prompt_ratings (
  id             uuid primary key default gen_random_uuid(),
  -- The prompt this rating belongs to; cascades on prompt deletion
  prompt_id      uuid not null references public.prompts(id) on delete cascade,
  -- Weighted aggregate of the five dimension scores (0–100)
  overall_score  integer not null check (overall_score between 0 and 100),
  -- Per-dimension numeric scores: { clarity, specificity, structure, tone, completeness }
  scores         jsonb not null,
  -- Per-dimension detailed feedback: { clarity: { score, comment, suggestions[] }, … }
  feedback       jsonb not null,
  -- Exact model string, e.g. "gpt-4o-mini" or "claude-haiku-4-5-20251001"
  model_used     text not null,
  -- AI provider: "openai" | "anthropic"
  provider       text not null check (provider in ('openai', 'anthropic')),
  created_at     timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Most common access pattern: fetch all ratings for a prompt
create index prompt_ratings_prompt_id_idx on public.prompt_ratings(prompt_id);

-- Efficiently retrieve the latest rating per prompt (DESC to put newest first)
-- UNIQUE so that (prompt_id, created_at) pairs are unique — needed for the index
create unique index prompt_ratings_latest_idx
  on public.prompt_ratings(prompt_id, created_at desc);
