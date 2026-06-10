-- =============================================================================
-- Migration: 20260610000006_functions_triggers
-- Purpose:   Counter helper functions used by API routes to atomically
--            increment view_count / fork_count without race conditions.
--            (update_updated_at was already created in migration 001.)
-- Affected:  public.prompts (counter columns)
-- Date:      2026-06-10
-- =============================================================================

-- ── increment_view_count ─────────────────────────────────────────────────────
-- Called by the /p/[slug] page server action so the increment is done in a
-- single round-trip and bypasses RLS (SECURITY DEFINER).
-- The caller must validate that the prompt is public before invoking this.
create or replace function public.increment_view_count(prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set view_count = view_count + 1
  where id = prompt_id
    -- only bump view count on published, non-deleted prompts
    and is_public = true
    and deleted_at is null;
end;
$$;

-- ── increment_fork_count ─────────────────────────────────────────────────────
-- Called by the fork API route after a new prompt row is successfully
-- inserted with fork_of = <original_id>.
-- SECURITY DEFINER so the forker doesn't need UPDATE rights on the original.
create or replace function public.increment_fork_count(prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set fork_count = fork_count + 1
  where id = prompt_id;
end;
$$;

-- ── increment_template_fork_count ────────────────────────────────────────────
-- Same pattern for system_templates — users cannot UPDATE that table directly.
create or replace function public.increment_template_fork_count(template_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.system_templates
  set fork_count = fork_count + 1
  where id = template_id;
end;
$$;
