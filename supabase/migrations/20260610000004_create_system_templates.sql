-- =============================================================================
-- Migration: 20260610000004_create_system_templates
-- Purpose:   Create the `system_templates` table — curated prompt templates
--            seeded by the platform. End users can browse and fork them but
--            cannot INSERT/UPDATE/DELETE (no such RLS policies are created).
-- Affected:  public.system_templates
-- Date:      2026-06-10
-- =============================================================================

create table public.system_templates (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null,
  -- Pre-assembled prompt text (Markdown)
  content_md   text not null,
  -- Builder block snapshots — same shape as prompts.blocks
  blocks       jsonb not null default '[]'::jsonb,
  -- Variable definitions — same shape as prompts.variables
  variables    jsonb not null default '[]'::jsonb,
  tags         text[] not null default '{}',
  -- Template category: one of four fixed values
  category     text not null check (category in ('coding', 'writing', 'analysis', 'roleplay')),
  -- Skill level signalled to the user
  difficulty   text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  -- Pre-computed AI score assigned during seeding (0–100)
  ai_score     integer check (ai_score between 0 and 100),
  -- Incremented each time a user forks this template
  fork_count   integer not null default 0,
  -- Controls display order within a category
  order_index  integer not null default 0,
  -- Featured templates are highlighted on the landing page
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Browse by category (most common query on /explore)
create index system_templates_category_idx on public.system_templates(category);

-- Landing page: only a small subset, so a partial index is efficient
create index system_templates_featured_idx
  on public.system_templates(is_featured)
  where is_featured = true;

-- Ordered listing within a category
create index system_templates_order_idx on public.system_templates(category, order_index);

-- ── Full-text search ──────────────────────────────────────────────────────────
-- Generated column over title + description (content_md is excluded to keep
-- the index smaller; templates have fixed content anyway).
alter table public.system_templates
  add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index system_templates_search_idx on public.system_templates using gin(search_vector);
