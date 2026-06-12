-- ============================================================
-- Migration: collections
-- Purpose: prompt collections / folders (F-09)
-- Tables: collections, collection_prompts
-- ============================================================

-- ── Collections / Folders ─────────────────────────────────────────────────────

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  description text,
  -- parent_id null = root folder
  parent_id   uuid references public.collections(id) on delete cascade,
  -- depth auto-set by trigger (max 5 levels)
  depth       int  not null default 0,
  is_public   boolean not null default false,
  -- slug only for public bundles, globally unique
  slug        text unique,
  color       text,
  icon        text,
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_collections_user_id
  on public.collections(user_id, order_index);

create index if not exists idx_collections_parent_id
  on public.collections(parent_id);

create index if not exists idx_collections_slug
  on public.collections(slug) where slug is not null;

-- ── Many-to-many: prompts in collections ─────────────────────────────────────

create table if not exists public.collection_prompts (
  collection_id uuid not null references public.collections(id) on delete cascade,
  prompt_id     uuid not null references public.prompts(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

create index if not exists idx_collection_prompts_prompt_id
  on public.collection_prompts(prompt_id);

-- ── Trigger: validate depth (max 5 levels) ───────────────────────────────────

create or replace function public.validate_collection_depth()
returns trigger language plpgsql as $$
declare
  parent_depth int;
begin
  if new.parent_id is null then
    new.depth := 0;
    return new;
  end if;

  select depth into parent_depth
  from public.collections
  where id = new.parent_id;

  if parent_depth is null then
    raise exception 'Parent collection not found';
  end if;

  -- parent at depth 4 = child at depth 5 (max)
  if parent_depth >= 4 then
    raise exception 'Maximum collection depth (5) exceeded';
  end if;

  new.depth := parent_depth + 1;
  return new;
end;
$$;

create trigger trg_validate_collection_depth
  before insert or update on public.collections
  for each row execute function public.validate_collection_depth();

-- ── Trigger: updated_at ───────────────────────────────────────────────────────

create trigger trg_collections_updated_at
  before update on public.collections
  for each row execute function public.update_updated_at();

-- ── RLS: collections ─────────────────────────────────────────────────────────

alter table public.collections enable row level security;

-- anon: only public collections
create policy "collections_select_anon"
  on public.collections for select to anon
  using (is_public = true);

-- authenticated: own + public
create policy "collections_select_own"
  on public.collections for select to authenticated
  using (auth.uid() = user_id or is_public = true);

create policy "collections_insert_own"
  on public.collections for insert to authenticated
  with check (auth.uid() = user_id);

create policy "collections_update_own"
  on public.collections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "collections_delete_own"
  on public.collections for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: collection_prompts ───────────────────────────────────────────────────

alter table public.collection_prompts enable row level security;

create policy "collection_prompts_select_anon"
  on public.collection_prompts for select to anon
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_public = true
    )
  );

create policy "collection_prompts_select_auth"
  on public.collection_prompts for select to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

create policy "collection_prompts_insert_own"
  on public.collection_prompts for insert to authenticated
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "collection_prompts_delete_own"
  on public.collection_prompts for delete to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );
