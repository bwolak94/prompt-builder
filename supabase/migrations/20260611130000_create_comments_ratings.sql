-- ============================================================
-- Migration: create_comments_ratings
-- Purpose: Social proof for public prompts (F-05)
-- Tables: prompt_star_ratings, prompt_comments, comment_helpful, comment_reports
-- Note: prompt_ratings already exists for AI scoring — user star ratings
--       use prompt_star_ratings to avoid name collision.
-- ============================================================

-- ── User star ratings (1–5) ───────────────────────────────────────────────────
create table if not exists public.prompt_star_ratings (
  id         uuid primary key default gen_random_uuid(),
  prompt_id  uuid not null references public.prompts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prompt_id, user_id)   -- one rating per user per prompt
);

create index if not exists idx_star_ratings_prompt_id
  on public.prompt_star_ratings(prompt_id);

-- ── Comments with threading (max depth 2) ─────────────────────────────────────
create table if not exists public.prompt_comments (
  id         uuid primary key default gen_random_uuid(),
  prompt_id  uuid not null references public.prompts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  -- parent_id null = top-level comment; non-null = reply (max depth 2 enforced in app)
  parent_id  uuid references public.prompt_comments(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  is_helpful int  not null default 0,  -- helpful upvote counter (denormalised)
  deleted_at timestamptz,              -- soft delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prompt_comments_prompt_id
  on public.prompt_comments(prompt_id, created_at desc);

create index if not exists idx_prompt_comments_parent_id
  on public.prompt_comments(parent_id);

-- ── Helpful upvotes (one per user per comment) ────────────────────────────────
create table if not exists public.comment_helpful (
  comment_id uuid not null references public.prompt_comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ── Moderation reports ────────────────────────────────────────────────────────
create table if not exists public.comment_reports (
  id         uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.prompt_comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  reason     text not null check (reason in ('spam', 'abuse', 'offtopic', 'other')),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)   -- one report per user per comment
);

-- ── Denormalised stats on prompts ─────────────────────────────────────────────
alter table public.prompts
  add column if not exists avg_rating    float default null,
  add column if not exists rating_count  int   not null default 0,
  add column if not exists comment_count int   not null default 0;

-- ── Trigger: update avg_rating and rating_count after star rating changes ──────
create or replace function update_prompt_rating_stats()
returns trigger language plpgsql as $$
begin
  update public.prompts
  set
    avg_rating   = (select avg(rating)::float from public.prompt_star_ratings
                    where prompt_id = coalesce(new.prompt_id, old.prompt_id)),
    rating_count = (select count(*)::int      from public.prompt_star_ratings
                    where prompt_id = coalesce(new.prompt_id, old.prompt_id))
  where id = coalesce(new.prompt_id, old.prompt_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_prompt_rating_stats
  after insert or update or delete on public.prompt_star_ratings
  for each row execute function update_prompt_rating_stats();

-- ── Trigger: update comment_count after comment changes ───────────────────────
create or replace function update_prompt_comment_count()
returns trigger language plpgsql as $$
begin
  update public.prompts
  set comment_count = (
    select count(*)::int from public.prompt_comments
    where prompt_id = coalesce(new.prompt_id, old.prompt_id)
      and deleted_at is null
  )
  where id = coalesce(new.prompt_id, old.prompt_id);
  return coalesce(new, old);
end;
$$;

create trigger trg_prompt_comment_count
  after insert or update or delete on public.prompt_comments
  for each row execute function update_prompt_comment_count();

-- ── RLS: prompt_star_ratings ─────────────────────────────────────────────────

alter table public.prompt_star_ratings enable row level security;

-- anon can read ratings on public prompts
create policy "star_ratings_select_anon"
  on public.prompt_star_ratings for select to anon
  using (exists (
    select 1 from public.prompts p where p.id = prompt_id and p.is_public = true
  ));

-- authenticated users can read ratings on public/own prompts
create policy "star_ratings_select_auth"
  on public.prompt_star_ratings for select to authenticated
  using (exists (
    select 1 from public.prompts p
    where p.id = prompt_id and (p.is_public = true or p.user_id = auth.uid())
  ));

create policy "star_ratings_insert_auth"
  on public.prompt_star_ratings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "star_ratings_update_own"
  on public.prompt_star_ratings for update to authenticated
  using (auth.uid() = user_id);

create policy "star_ratings_delete_own"
  on public.prompt_star_ratings for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: prompt_comments ─────────────────────────────────────────────────────

alter table public.prompt_comments enable row level security;

create policy "comments_select_anon"
  on public.prompt_comments for select to anon
  using (
    deleted_at is null and
    exists (select 1 from public.prompts p where p.id = prompt_id and p.is_public = true)
  );

create policy "comments_select_auth"
  on public.prompt_comments for select to authenticated
  using (
    deleted_at is null and
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id and (p.is_public = true or p.user_id = auth.uid())
    )
  );

create policy "comments_insert_auth"
  on public.prompt_comments for insert to authenticated
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.prompt_comments for update to authenticated
  using (auth.uid() = user_id);

-- ── RLS: comment_helpful ─────────────────────────────────────────────────────

alter table public.comment_helpful enable row level security;

create policy "helpful_select_anon"
  on public.comment_helpful for select to anon using (true);

create policy "helpful_select_auth"
  on public.comment_helpful for select to authenticated using (true);

create policy "helpful_insert_auth"
  on public.comment_helpful for insert to authenticated
  with check (auth.uid() = user_id);

create policy "helpful_delete_own"
  on public.comment_helpful for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: comment_reports ─────────────────────────────────────────────────────

alter table public.comment_reports enable row level security;

create policy "reports_insert_auth"
  on public.comment_reports for insert to authenticated
  with check (auth.uid() = user_id);

create policy "reports_select_own"
  on public.comment_reports for select to authenticated
  using (auth.uid() = user_id);
