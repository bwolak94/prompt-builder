-- =============================================================================
-- Migration: 20260611100000_add_plan_to_profiles
-- Purpose:   Add `plan` column to profiles to support Free/Pro feature gating.
-- Affected:  public.profiles
-- =============================================================================

-- Add plan enum type and column
-- plan = 'free' (default) | 'pro'
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro'));

comment on column public.profiles.plan is
  'Subscription tier: free (default) or pro. Controls access to advanced features.';
