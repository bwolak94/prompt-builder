-- ============================================================
-- MIGRATION: webhooks
-- Purpose: outbound webhook integrations (F-20)
-- Affected tables: webhooks, webhook_deliveries
-- ============================================================

do $$ begin
  create type webhook_type as enum ('generic', 'slack', 'discord');
exception when duplicate_object then null;
end $$;

create table if not exists public.webhooks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       webhook_type not null default 'generic',
  label      text not null,
  url        text not null,
  events     text[] not null default '{}',
  secret     text,                          -- HMAC secret for generic webhooks
  headers    jsonb not null default '{}',   -- custom headers for generic webhooks
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Delivery log per webhook send attempt
create table if not exists public.webhook_deliveries (
  id            uuid primary key default gen_random_uuid(),
  webhook_id    uuid not null references public.webhooks(id) on delete cascade,
  event_type    text not null,
  payload       jsonb not null,
  status_code   int,
  response_body text,
  attempt       int not null default 1,
  delivered_at  timestamptz not null default now(),
  error         text
);

create index if not exists idx_webhooks_user_id
  on public.webhooks(user_id);

create index if not exists idx_webhook_deliveries_webhook_id
  on public.webhook_deliveries(webhook_id, delivered_at desc);

-- RLS
alter table public.webhooks           enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "webhooks_select_own"
  on public.webhooks for select to authenticated
  using (auth.uid() = user_id);

create policy "webhooks_insert_own"
  on public.webhooks for insert to authenticated
  with check (auth.uid() = user_id);

create policy "webhooks_update_own"
  on public.webhooks for update to authenticated
  using (auth.uid() = user_id);

create policy "webhooks_delete_own"
  on public.webhooks for delete to authenticated
  using (auth.uid() = user_id);

create policy "deliveries_select_own"
  on public.webhook_deliveries for select to authenticated
  using (
    exists (
      select 1 from public.webhooks w
      where w.id = webhook_id and w.user_id = auth.uid()
    )
  );

-- Service role inserts deliveries (fire-and-forget from server)
create policy "deliveries_insert_service"
  on public.webhook_deliveries for insert to authenticated
  with check (true);
