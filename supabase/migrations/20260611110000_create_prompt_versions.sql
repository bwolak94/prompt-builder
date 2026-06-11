-- =============================================================================
-- Migration: 20260611110000_create_prompt_versions
-- Purpose:   F-02 Version History — git-like snapshots for prompts.
-- Affected:  public.prompt_versions
-- =============================================================================

create table if not exists public.prompt_versions (
  id             uuid primary key default gen_random_uuid(),
  prompt_id      uuid not null references public.prompts(id) on delete cascade,
  version_number int  not null,
  -- full prompt snapshot at save time
  title          text not null,
  description    text,
  blocks         jsonb not null,
  variables      jsonb not null default '[]',
  content_md     text not null,
  tags           text[] not null default '{}',
  -- optional commit-message style note
  change_summary text,
  created_at     timestamptz not null default now(),

  unique (prompt_id, version_number)
);

create index if not exists idx_prompt_versions_prompt_id
  on public.prompt_versions (prompt_id, version_number desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.prompt_versions enable row level security;

-- owner can read their prompt's versions
create policy "versions_select_own"
  on public.prompt_versions for select to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- owner can insert versions for their prompts
create policy "versions_insert_own"
  on public.prompt_versions for insert to authenticated
  with check (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- owner can delete old versions (needed for free-tier pruning)
create policy "versions_delete_own"
  on public.prompt_versions for delete to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- ── Atomic version insert + free-tier pruning ─────────────────────────────────
-- Increments version_number, inserts snapshot, then deletes oldest versions
-- beyond the plan limit (free=3, pro=unlimited).
create or replace function public.create_prompt_version(
  p_prompt_id   uuid,
  p_user_id     uuid,
  p_title       text,
  p_description text,
  p_blocks      jsonb,
  p_variables   jsonb,
  p_content_md  text,
  p_tags        text[],
  p_summary     text default null
) returns public.prompt_versions
language plpgsql security definer
set search_path = public
as $$
declare
  v_next_number  int;
  v_plan         text;
  v_max_versions int;
  v_new_version  public.prompt_versions;
begin
  -- verify ownership
  if not exists (
    select 1 from public.prompts where id = p_prompt_id and user_id = p_user_id
  ) then
    raise exception 'Forbidden' using errcode = 'P0001';
  end if;

  -- read user plan
  select plan into v_plan from public.profiles where id = p_user_id;
  v_max_versions := case when v_plan = 'pro' then 2147483647 else 3 end;

  -- next sequential version number for this prompt
  select coalesce(max(version_number), 0) + 1
  into v_next_number
  from public.prompt_versions
  where prompt_id = p_prompt_id;

  -- insert new snapshot
  insert into public.prompt_versions (
    prompt_id, version_number, title, description,
    blocks, variables, content_md, tags, change_summary
  ) values (
    p_prompt_id, v_next_number, p_title, p_description,
    p_blocks, p_variables, p_content_md, p_tags, p_summary
  ) returning * into v_new_version;

  -- prune oldest versions beyond limit
  delete from public.prompt_versions
  where prompt_id = p_prompt_id
    and version_number not in (
      select version_number
      from public.prompt_versions
      where prompt_id = p_prompt_id
      order by version_number desc
      limit v_max_versions
    );

  return v_new_version;
end;
$$;
