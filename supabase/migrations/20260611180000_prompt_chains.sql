-- ============================================================
-- Migration: prompt_chains
-- Purpose: prompt chain builder (F-11)
-- Tables: prompt_chains, chain_nodes
-- ============================================================

-- ── Chains (top-level entity) ─────────────────────────────────────────────────

create table if not exists public.prompt_chains (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_prompt_chains_user_id
  on public.prompt_chains(user_id, updated_at desc);

-- ── Chain nodes (ordered steps) ───────────────────────────────────────────────

create table if not exists public.chain_nodes (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid not null references public.prompt_chains(id) on delete cascade,
  -- optional link to a saved prompt; null for inline nodes
  prompt_id   uuid references public.prompts(id) on delete set null,
  title       text not null default '',
  content_md  text not null default '',
  -- zero-based display order within the chain
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chain_nodes_chain_id
  on public.chain_nodes(chain_id, order_index);

-- ── Trigger: updated_at on chains ─────────────────────────────────────────────

create trigger trg_prompt_chains_updated_at
  before update on public.prompt_chains
  for each row execute function public.update_updated_at();

-- ── RLS: prompt_chains ────────────────────────────────────────────────────────

alter table public.prompt_chains enable row level security;

create policy "chains_select_anon"
  on public.prompt_chains for select to anon
  using (is_public = true);

create policy "chains_select_own"
  on public.prompt_chains for select to authenticated
  using (auth.uid() = user_id or is_public = true);

create policy "chains_insert_own"
  on public.prompt_chains for insert to authenticated
  with check (auth.uid() = user_id);

create policy "chains_update_own"
  on public.prompt_chains for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chains_delete_own"
  on public.prompt_chains for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: chain_nodes ──────────────────────────────────────────────────────────

alter table public.chain_nodes enable row level security;

create policy "chain_nodes_select_anon"
  on public.chain_nodes for select to anon
  using (
    exists (
      select 1 from public.prompt_chains c
      where c.id = chain_id and c.is_public = true
    )
  );

create policy "chain_nodes_select_auth"
  on public.chain_nodes for select to authenticated
  using (
    exists (
      select 1 from public.prompt_chains c
      where c.id = chain_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

create policy "chain_nodes_insert_own"
  on public.chain_nodes for insert to authenticated
  with check (
    exists (
      select 1 from public.prompt_chains c
      where c.id = chain_id and c.user_id = auth.uid()
    )
  );

create policy "chain_nodes_update_own"
  on public.chain_nodes for update to authenticated
  using (
    exists (
      select 1 from public.prompt_chains c
      where c.id = chain_id and c.user_id = auth.uid()
    )
  );

create policy "chain_nodes_delete_own"
  on public.chain_nodes for delete to authenticated
  using (
    exists (
      select 1 from public.prompt_chains c
      where c.id = chain_id and c.user_id = auth.uid()
    )
  );
