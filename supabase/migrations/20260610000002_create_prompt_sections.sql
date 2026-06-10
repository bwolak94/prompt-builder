-- =============================================================================
-- Migration: 20260610000002_create_prompt_sections
-- Purpose:   Create the `prompt_sections` lookup table that drives the prompt
--            builder palette. Rows are inserted via seed.sql and are
--            read-only for all end users (no INSERT/UPDATE/DELETE policies).
-- Affected:  public.prompt_sections
-- Date:      2026-06-10
-- =============================================================================

create table public.prompt_sections (
  id             uuid primary key default gen_random_uuid(),
  -- Polish label shown in the builder UI
  name           text not null,
  -- English label for i18n
  name_en        text not null,
  -- URL-safe identifier used in code: "role", "context", "task", …
  slug           text not null unique,
  -- User-facing description (PL)
  description    text not null,
  description_en text not null,
  -- Lucide icon component name, e.g. "User", "BookOpen", "Target"
  icon           text not null,
  -- Hex colour for the block header, e.g. "#7C3AED"
  color          text not null,
  -- Optional placeholder text shown inside the textarea
  placeholder    text,
  -- Determines display order in the palette
  order_index    integer not null,
  -- Groups sections: core (always visible), optional, advanced
  category       text not null check (category in ('core', 'optional', 'advanced')),
  created_at     timestamptz not null default now()
);

-- Index for ordered palette queries
create index prompt_sections_order_idx on public.prompt_sections(order_index);

-- Index for slug lookups (used heavily in builder/runtime)
create index prompt_sections_slug_idx on public.prompt_sections(slug);
