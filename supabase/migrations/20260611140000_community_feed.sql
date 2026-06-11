-- ============================================================
-- Migration: community_feed
-- Purpose: Community feed (F-06) — trending prompts materialized view
--          and is_featured flag for admin curation.
-- Tables affected: prompts (add is_featured)
-- New objects: trending_prompts (materialized view), refresh_trending_prompts()
-- ============================================================

-- add admin-curated featured flag to prompts
alter table public.prompts
  add column if not exists is_featured boolean not null default false;

-- ── Materialized view for trending score ─────────────────────────────────────

create materialized view if not exists public.trending_prompts as
select
  p.id,
  p.user_id,
  p.title,
  p.description,
  p.tags,
  p.fork_count,
  p.view_count,
  coalesce(p.avg_rating, 0)    as avg_rating,
  p.rating_count,
  p.comment_count,
  p.is_featured,
  p.created_at,
  p.updated_at,
  -- weighted log-based trending score with time decay
  (
    log(greatest(p.fork_count, 1))  * 3.0 +
    log(greatest(p.view_count, 1))  * 1.0 +
    coalesce(p.avg_rating, 0)       * 2.0 +
    extract(epoch from (now() - p.updated_at)) / -86400.0 * 0.5
  ) as trending_score,
  pr.display_name as author_name,
  pr.avatar_url   as author_avatar
from public.prompts p
join public.profiles pr on pr.id = p.user_id
where p.is_public  = true
  and p.deleted_at is null;

create unique index if not exists idx_trending_prompts_id
  on public.trending_prompts(id);

create index if not exists idx_trending_score
  on public.trending_prompts(trending_score desc);

create index if not exists idx_trending_created_at
  on public.trending_prompts(created_at desc);

create index if not exists idx_trending_avg_rating
  on public.trending_prompts(avg_rating desc, rating_count desc);

create index if not exists idx_trending_is_featured
  on public.trending_prompts(is_featured) where is_featured = true;

-- ── Refresh function (called by background job / cron) ───────────────────────

create or replace function public.refresh_trending_prompts()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.trending_prompts;
$$;

-- Grant execute to authenticated and anon roles so the API can call it via RPC
grant execute on function public.refresh_trending_prompts() to authenticated;
