-- =============================================================================
-- Migration: 20260610000003_create_prompts
-- Purpose:   Create the `prompts` table — the core entity of PromptBase.
--            Includes a generated tsvector column for full-text search,
--            a soft-delete pattern (deleted_at), and an updated_at trigger.
-- Affected:  public.prompts
-- Dependencies: public.profiles (migration 001),
--               public.update_updated_at() (migration 001)
-- Date:      2026-06-10
-- =============================================================================

create table public.prompts (
  id           uuid primary key default gen_random_uuid(),
  -- Owner — hard-linked to profiles; deleting the profile cascades here
  user_id      uuid not null references public.profiles(id) on delete cascade,
  -- Human-readable title; 1–100 chars enforced at DB level
  title        text not null check (char_length(title) between 1 and 100),
  -- Optional summary shown in cards / explore page; max 500 chars
  description  text check (char_length(description) <= 500),
  -- Rendered markdown — the final assembled prompt text
  content_md   text not null,
  -- Snapshot of builder blocks: [{id, section_slug, content, order_index}]
  blocks       jsonb not null default '[]'::jsonb,
  -- Variable definitions: [{name, label, defaultValue, type, options?}]
  variables    jsonb not null default '[]'::jsonb,
  -- Free-form tags for filtering
  tags         text[] not null default '{}',
  -- false = private (only owner), true = visible in /explore
  is_public    boolean not null default false,
  -- Short unique slug for the public share URL: /p/[slug]
  -- Required when is_public = true (enforced by constraint below)
  slug         text unique,
  -- Original prompt if this is a fork
  fork_of      uuid references public.prompts(id) on delete set null,
  -- Soft-delete: set to now() instead of hard-deleting rows
  deleted_at   timestamptz,
  view_count   integer not null default 0,
  fork_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Business rule: a public prompt must have a slug
  constraint slug_required_when_public check (
    (is_public = false) or (is_public = true and slug is not null)
  )
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Frequent: list all prompts for a given user
create index prompts_user_id_idx on public.prompts(user_id);

-- Frequent: resolve /p/[slug] → prompt row (partial: only for non-null slugs)
create index prompts_slug_idx on public.prompts(slug) where slug is not null;

-- Frequent: /explore page — public, non-deleted prompts sorted by recency
create index prompts_public_idx
  on public.prompts(is_public, created_at desc)
  where is_public = true and deleted_at is null;

-- ── Full-text search ──────────────────────────────────────────────────────────
-- Generated column — automatically maintained by Postgres; no triggers needed.
-- Combines title + description + full prompt body.
alter table public.prompts
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content_md, '')
    )
  ) stored;

create index prompts_search_idx on public.prompts using gin(search_vector);

-- ── Trigger ───────────────────────────────────────────────────────────────────
create trigger prompts_updated_at
  before update on public.prompts
  for each row execute function public.update_updated_at();
