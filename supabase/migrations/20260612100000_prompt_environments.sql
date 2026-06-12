-- ============================================================
-- MIGRATION: prompt_environments
-- Purpose: dev/staging/production environments for prompts (F-18)
-- Affected tables: prompt_environments, environment_promotions
-- ============================================================

do $$ begin
  create type prompt_env as enum ('dev', 'staging', 'production');
exception when duplicate_object then null;
end $$;

-- Current version pinned to each environment
create table if not exists public.prompt_environments (
  id             uuid primary key default gen_random_uuid(),
  prompt_id      uuid not null references public.prompts(id) on delete cascade,
  environment    prompt_env not null,
  version_id     uuid references public.prompt_versions(id) on delete set null,
  version_number int,
  content_md     text,
  blocks         jsonb,
  promoted_by    uuid references public.profiles(id) on delete set null,
  promoted_at    timestamptz not null default now(),
  unique (prompt_id, environment)
);

-- Audit log of promotions
create table if not exists public.environment_promotions (
  id          uuid primary key default gen_random_uuid(),
  prompt_id   uuid not null references public.prompts(id) on delete cascade,
  from_env    prompt_env not null,
  to_env      prompt_env not null,
  version_id  uuid not null references public.prompt_versions(id),
  promoted_by uuid not null references public.profiles(id),
  promoted_at timestamptz not null default now()
);

create index if not exists idx_prompt_environments_prompt_id
  on public.prompt_environments(prompt_id);

create index if not exists idx_env_promotions_prompt_id
  on public.environment_promotions(prompt_id, promoted_at desc);

-- RLS
alter table public.prompt_environments   enable row level security;
alter table public.environment_promotions enable row level security;

-- Owner can read their environments
create policy "environments_select_own"
  on public.prompt_environments for select to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

-- Anon can read environments for public prompts (for public /api/v1/)
create policy "environments_select_public"
  on public.prompt_environments for select to anon
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.is_public = true
    )
  );

create policy "environments_insert_own"
  on public.prompt_environments for insert to authenticated
  with check (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "environments_update_own"
  on public.prompt_environments for update to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "env_promotions_select_own"
  on public.environment_promotions for select to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and p.user_id = auth.uid()
    )
  );

create policy "env_promotions_insert_own"
  on public.environment_promotions for insert to authenticated
  with check (auth.uid() = promoted_by);
