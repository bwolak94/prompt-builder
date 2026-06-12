-- ============================================================
-- MIGRATION: api_keys_v1
-- Purpose: Public REST API keys for F-17
-- Affected tables: api_keys, api_key_usage
-- ============================================================

-- REST API keys (pb_live_xxxx)
create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  key_prefix    text not null,              -- always 'pb_live_'
  key_hash      text not null unique,       -- SHA-256 of plaintext key
  key_suffix    text not null,              -- last 4 chars for display
  label         text not null,
  rate_limit    int  not null default 1000, -- requests per day
  last_used_at  timestamptz,
  request_count int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Daily usage counters
create table if not exists public.api_key_usage (
  id      uuid primary key default gen_random_uuid(),
  key_id  uuid not null references public.api_keys(id) on delete cascade,
  date    date not null default current_date,
  count   int  not null default 0,
  unique (key_id, date)
);

create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_key_hash     on public.api_keys(key_hash);

-- RLS
alter table public.api_keys      enable row level security;
alter table public.api_key_usage enable row level security;

create policy "api_keys_select_own"
  on public.api_keys for select to authenticated
  using (auth.uid() = user_id);

create policy "api_keys_insert_own"
  on public.api_keys for insert to authenticated
  with check (auth.uid() = user_id);

create policy "api_keys_update_own"
  on public.api_keys for update to authenticated
  using (auth.uid() = user_id);

create policy "api_keys_delete_own"
  on public.api_keys for delete to authenticated
  using (auth.uid() = user_id);

create policy "api_key_usage_select_own"
  on public.api_key_usage for select to authenticated
  using (
    exists (
      select 1 from public.api_keys k
      where k.id = key_id and k.user_id = auth.uid()
    )
  );

-- Atomic: verify key hash, check daily rate limit, increment counter
create or replace function verify_api_key_and_check_limit(p_key_hash text)
returns table (user_id uuid, key_id uuid, is_allowed boolean, remaining int)
language plpgsql security definer as $$
declare
  v_key  public.api_keys;
  v_used int;
begin
  select * into v_key
  from public.api_keys
  where key_hash = p_key_hash and is_active = true;

  if not found then
    return query select null::uuid, null::uuid, false, 0;
    return;
  end if;

  select coalesce(sum(count), 0) into v_used
  from public.api_key_usage
  where key_id = v_key.id and date = current_date;

  if v_used >= v_key.rate_limit then
    return query select v_key.user_id, v_key.id, false, 0;
    return;
  end if;

  insert into public.api_key_usage (key_id, date, count)
  values (v_key.id, current_date, 1)
  on conflict (key_id, date) do update set count = api_key_usage.count + 1;

  update public.api_keys
  set last_used_at = now(), request_count = request_count + 1
  where id = v_key.id;

  return query select v_key.user_id, v_key.id, true, v_key.rate_limit - v_used - 1;
end;
$$;
