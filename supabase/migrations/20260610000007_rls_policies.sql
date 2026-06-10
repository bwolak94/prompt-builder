-- =============================================================================
-- Migration: 20260610000007_rls_policies
-- Purpose:   Enable Row Level Security on every public table and define
--            fine-grained policies. Policies are GRANULAR:
--              - one policy per operation (SELECT / INSERT / UPDATE / DELETE)
--              - one policy per Supabase role (anon / authenticated)
-- Affected:  profiles, prompt_sections, prompts, system_templates,
--            prompt_ratings
-- Date:      2026-06-10
-- =============================================================================

-- =============================================================================
-- PROFILES
-- =============================================================================
alter table public.profiles enable row level security;

-- Anyone (including logged-out visitors) can read all profiles.
-- Needed for /profile/[username] public pages.
create policy "profiles_select_anon"
  on public.profiles
  for select
  to anon
  using (true);

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Only the profile owner may update their own row.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profiles are created automatically by the handle_new_user trigger
-- (SECURITY DEFINER), so no INSERT policy is needed for end users.
-- No DELETE policy — profiles are removed via cascading from auth.users deletion.


-- =============================================================================
-- PROMPT_SECTIONS
-- =============================================================================
alter table public.prompt_sections enable row level security;

-- Sections are platform-managed seed data; all roles can read, nobody can write.
create policy "prompt_sections_select_anon"
  on public.prompt_sections
  for select
  to anon
  using (true);

create policy "prompt_sections_select_authenticated"
  on public.prompt_sections
  for select
  to authenticated
  using (true);


-- =============================================================================
-- PROMPTS
-- =============================================================================
alter table public.prompts enable row level security;

-- Anon: only public, non-deleted prompts are visible.
create policy "prompts_select_anon"
  on public.prompts
  for select
  to anon
  using (is_public = true and deleted_at is null);

-- Authenticated: own prompts (any visibility) + others' public, non-deleted.
create policy "prompts_select_authenticated"
  on public.prompts
  for select
  to authenticated
  using (
    (auth.uid() = user_id and deleted_at is null)
    or (is_public = true and deleted_at is null)
  );

-- Only authenticated users may create prompts; user_id must match session.
create policy "prompts_insert_authenticated"
  on public.prompts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Owner-only updates.
create policy "prompts_update_own"
  on public.prompts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owner-only hard deletes (soft-delete preferred; this is a safety valve).
create policy "prompts_delete_own"
  on public.prompts
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- =============================================================================
-- SYSTEM_TEMPLATES
-- =============================================================================
alter table public.system_templates enable row level security;

-- Templates are platform-managed; all roles can read, nobody can write.
create policy "system_templates_select_anon"
  on public.system_templates
  for select
  to anon
  using (true);

create policy "system_templates_select_authenticated"
  on public.system_templates
  for select
  to authenticated
  using (true);


-- =============================================================================
-- PROMPT_RATINGS
-- =============================================================================
alter table public.prompt_ratings enable row level security;

-- Anon: may read ratings only for public, non-deleted prompts.
create policy "prompt_ratings_select_anon"
  on public.prompt_ratings
  for select
  to anon
  using (
    exists (
      select 1
      from public.prompts p
      where p.id = prompt_id
        and p.is_public = true
        and p.deleted_at is null
    )
  );

-- Authenticated: may read ratings for public prompts OR their own private prompts.
create policy "prompt_ratings_select_authenticated"
  on public.prompt_ratings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.prompts p
      where p.id = prompt_id
        and p.deleted_at is null
        and (p.is_public = true or p.user_id = auth.uid())
    )
  );

-- Authenticated users may only insert a rating for a prompt they own.
-- The AI scoring API verifies ownership before calling this, but the DB
-- constraint provides a second line of defence.
create policy "prompt_ratings_insert_own"
  on public.prompt_ratings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.prompts p
      where p.id = prompt_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

-- Ratings are immutable once written; no UPDATE or DELETE policies.
