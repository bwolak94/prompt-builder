-- =============================================================================
-- Migration: 20260611100001_create_run_tables
-- Purpose:   F-01 Run Prompt — credits tracking, BYOK API keys, run logs.
-- Affected:  public.run_credits, public.user_api_keys, public.run_logs
-- =============================================================================

-- ── run_credits ───────────────────────────────────────────────────────────────
-- Tracks how many "hosted" runs (using platform API key) a user has used.
-- Pro users have unlimited runs; Free users have 50/month.
create table if not exists public.run_credits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  -- month slot: YYYY-MM (e.g. "2026-06")
  month         text not null,
  used          int not null default 0,
  -- limit: -1 = unlimited (pro), 50 = free tier
  monthly_limit int not null default 50,
  updated_at    timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists idx_run_credits_user_month
  on public.run_credits (user_id, month);

alter table public.run_credits enable row level security;

create policy "run_credits_select_own"
  on public.run_credits for select to authenticated
  using (auth.uid() = user_id);

create policy "run_credits_insert_own"
  on public.run_credits for insert to authenticated
  with check (auth.uid() = user_id);

create policy "run_credits_update_own"
  on public.run_credits for update to authenticated
  using (auth.uid() = user_id);

-- ── user_api_keys (BYOK) ──────────────────────────────────────────────────────
-- Stores encrypted user-supplied API keys for external AI providers.
-- The key_encrypted column holds AES-256-GCM ciphertext (base64 encoded).
-- The plaintext key is NEVER stored.
create table if not exists public.user_api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  -- Provider: 'openai' | 'anthropic' | 'gemini'
  provider      text not null check (provider in ('openai', 'anthropic', 'gemini')),
  -- AES-256-GCM encrypted key: base64(iv + ciphertext)
  key_encrypted text not null,
  -- Display hint: "sk-...abc4" (first 3 + last 4 chars)
  key_hint      text not null,
  label         text not null default '',
  is_active     boolean not null default true,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  -- One active key per provider per user
  unique (user_id, provider)
);

create index if not exists idx_user_api_keys_user_id
  on public.user_api_keys (user_id);

alter table public.user_api_keys enable row level security;

create policy "user_api_keys_select_own"
  on public.user_api_keys for select to authenticated
  using (auth.uid() = user_id);

create policy "user_api_keys_insert_own"
  on public.user_api_keys for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_api_keys_update_own"
  on public.user_api_keys for update to authenticated
  using (auth.uid() = user_id);

create policy "user_api_keys_delete_own"
  on public.user_api_keys for delete to authenticated
  using (auth.uid() = user_id);

-- ── run_logs ──────────────────────────────────────────────────────────────────
-- Audit log of every prompt execution.
create table if not exists public.run_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  prompt_id       uuid references public.prompts(id) on delete set null,
  -- Which model was used
  provider        text not null,
  model           text not null,
  -- 'hosted' = platform key, 'byok' = user's own key
  key_source      text not null check (key_source in ('hosted', 'byok')),
  -- Token usage (if reported by provider)
  input_tokens    int,
  output_tokens   int,
  -- Execution outcome
  status          text not null check (status in ('success', 'error', 'timeout')),
  error_message   text,
  -- Duration in milliseconds
  duration_ms     int,
  created_at      timestamptz not null default now()
);

create index if not exists idx_run_logs_user_id
  on public.run_logs (user_id, created_at desc);

create index if not exists idx_run_logs_prompt_id
  on public.run_logs (prompt_id);

alter table public.run_logs enable row level security;

create policy "run_logs_select_own"
  on public.run_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "run_logs_insert_own"
  on public.run_logs for insert to authenticated
  with check (auth.uid() = user_id);

-- ── Atomic credit check + increment ──────────────────────────────────────────
-- Returns (allowed, remaining) — atomically checks and increments usage.
create or replace function public.check_and_increment_run_credits(
  p_user_id uuid,
  p_month text
) returns table (allowed boolean, remaining int)
language plpgsql security definer
set search_path = public
as $$
declare
  v_credits public.run_credits;
begin
  -- Upsert the credits row for this user+month
  insert into public.run_credits (user_id, month, used, monthly_limit)
  values (p_user_id, p_month, 0, 50)
  on conflict (user_id, month) do nothing;

  select * into v_credits from public.run_credits
  where user_id = p_user_id and month = p_month;

  -- -1 = unlimited (pro users)
  if v_credits.monthly_limit = -1 then
    update public.run_credits set used = used + 1, updated_at = now()
    where user_id = p_user_id and month = p_month;
    return query select true, -1;
    return;
  end if;

  -- Check limit
  if v_credits.used >= v_credits.monthly_limit then
    return query select false, 0;
    return;
  end if;

  -- Increment and return remaining
  update public.run_credits set used = used + 1, updated_at = now()
  where user_id = p_user_id and month = p_month;

  return query select true, v_credits.monthly_limit - v_credits.used - 1;
end;
$$;
