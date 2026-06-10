-- =============================================================================
-- Migration: 20260610000001_create_profiles
-- Purpose:   Create the `update_updated_at` utility function (used by all
--            tables with an updated_at column), the `profiles` table that
--            extends auth.users, and the `handle_new_user` trigger that
--            auto-creates a profile row on every new signup.
-- Affected:  public.profiles, auth.users (trigger only)
-- Date:      2026-06-10
-- =============================================================================

-- ── update_updated_at — shared utility, created first ───────────────────────
-- Used as a BEFORE UPDATE trigger function on any table that has updated_at.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One-to-one extension of auth.users. Cascades on user deletion so there
-- are never orphaned profile rows.
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  -- @handle used in public URLs: /profile/[username]
  username      text unique,
  avatar_url    text,
  -- bio capped at 500 chars — enforced at the DB layer
  bio           text check (char_length(bio) <= 500),
  -- user preferences stored as JSONB (defaultModel, language)
  preferences   jsonb not null default '{"defaultModel":"openai","language":"pl"}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-bump updated_at on every UPDATE
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- ── handle_new_user — auto-create profile on signup ─────────────────────────
-- Runs AFTER INSERT on auth.users (managed by GoTrue).
-- security definer + explicit search_path prevents search_path injection.
-- username is derived from the email local-part, sanitised to [a-z0-9],
-- then suffixed with the first 6 chars of the UUID to guarantee uniqueness.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'))
      || '_' || substring(new.id::text, 1, 6)
  );
  return new;
end;
$$;

-- Fires once per new auth.users row (i.e. every successful registration)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
