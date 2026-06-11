-- ============================================================
-- Migration: challenges
-- Purpose: weekly prompt challenges with voting, badges,
--          proposals, and leaderboard (F-07)
-- ============================================================

-- ── Proposals ────────────────────────────────────────────────────────────────

create table if not exists public.challenge_proposals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 5 and 200),
  description text not null check (char_length(description) between 20 and 1000),
  upvotes     int  not null default 0,
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_proposals_status
  on public.challenge_proposals(status, upvotes desc);

create table if not exists public.challenge_proposal_votes (
  proposal_id uuid not null references public.challenge_proposals(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  primary key (proposal_id, user_id)
);

-- ── Challenges ────────────────────────────────────────────────────────────────

create table if not exists public.challenges (
  id             uuid primary key default gen_random_uuid(),
  proposal_id    uuid references public.challenge_proposals(id),
  title          text not null,
  description    text not null,
  category       text,
  status         text not null default 'upcoming'
                 check (status in ('upcoming', 'active', 'voting', 'completed')),
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  voting_ends_at timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_challenges_status
  on public.challenges(status, starts_at desc);

-- ── Submissions ───────────────────────────────────────────────────────────────

create table if not exists public.challenge_submissions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  prompt_id    uuid not null references public.prompts(id) on delete cascade,
  vote_count   int  not null default 0,
  rank         int,
  created_at   timestamptz not null default now(),
  unique (challenge_id, user_id),
  unique (challenge_id, prompt_id)
);

create index if not exists idx_submissions_challenge
  on public.challenge_submissions(challenge_id, vote_count desc);

-- ── Votes on submissions ──────────────────────────────────────────────────────

create table if not exists public.challenge_votes (
  submission_id uuid not null references public.challenge_submissions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  primary key (submission_id, user_id)
);

-- ── Badges ───────────────────────────────────────────────────────────────────

create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null,
  icon        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_badges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  badge_id     uuid not null references public.badges(id),
  challenge_id uuid references public.challenges(id),
  awarded_at   timestamptz not null default now(),
  unique (user_id, badge_id, challenge_id)
);

create index if not exists idx_user_badges_user_id
  on public.user_badges(user_id);

-- ── Leaderboard (materialized view) ──────────────────────────────────────────

create materialized view if not exists public.challenge_leaderboard as
select
  pr.id                                                                    as user_id,
  pr.display_name,
  pr.avatar_url,
  count(distinct ub.id) filter (where b.slug = 'challenge_winner')        as wins,
  count(distinct ub.id) filter (where b.slug = 'top_10')                  as top10s,
  count(distinct cs.id)                                                    as total_submissions,
  coalesce(sum(cs.vote_count), 0)                                          as total_votes
from public.profiles pr
join public.user_badges ub on ub.user_id = pr.id
join public.badges b       on b.id = ub.badge_id
left join public.challenge_submissions cs on cs.user_id = pr.id
group by pr.id, pr.display_name, pr.avatar_url
order by wins desc, total_votes desc;

create unique index if not exists idx_leaderboard_user_id
  on public.challenge_leaderboard(user_id);

-- ── Refresh function ──────────────────────────────────────────────────────────

create or replace function public.refresh_challenge_leaderboard()
returns void language sql security definer as $$
  refresh materialized view concurrently public.challenge_leaderboard;
$$;

-- ── Badge award function (called after challenge completion) ──────────────────

create or replace function public.award_challenge_badges(p_challenge_id uuid)
returns void language plpgsql security definer as $$
declare
  v_winner_badge_id  uuid;
  v_top10_badge_id   uuid;
  v_debut_badge_id   uuid;
  rec record;
  v_rank int := 0;
begin
  select id into v_winner_badge_id from public.badges where slug = 'challenge_winner';
  select id into v_top10_badge_id  from public.badges where slug = 'top_10';
  select id into v_debut_badge_id  from public.badges where slug = 'first_challenge';

  -- rank submissions by vote_count
  for rec in
    select id, user_id, vote_count
    from public.challenge_submissions
    where challenge_id = p_challenge_id
    order by vote_count desc
  loop
    v_rank := v_rank + 1;

    -- update rank on submission
    update public.challenge_submissions set rank = v_rank where id = rec.id;

    -- award winner badge to rank 1
    if v_rank = 1 then
      insert into public.user_badges (user_id, badge_id, challenge_id)
      values (rec.user_id, v_winner_badge_id, p_challenge_id)
      on conflict do nothing;
    end if;

    -- award top_10 badge to ranks 2-10
    if v_rank between 2 and 10 then
      insert into public.user_badges (user_id, badge_id, challenge_id)
      values (rec.user_id, v_top10_badge_id, p_challenge_id)
      on conflict do nothing;
    end if;
  end loop;

  -- award debut badge to first-time participants
  for rec in
    select cs.user_id
    from public.challenge_submissions cs
    where cs.challenge_id = p_challenge_id
      and not exists (
        select 1 from public.challenge_submissions cs2
        where cs2.user_id = cs.user_id
          and cs2.challenge_id <> p_challenge_id
      )
  loop
    insert into public.user_badges (user_id, badge_id, challenge_id)
    values (rec.user_id, v_debut_badge_id, p_challenge_id)
    on conflict do nothing;
  end loop;

  -- refresh leaderboard
  perform public.refresh_challenge_leaderboard();
end;
$$;

-- ── Status auto-update function (called by pg_cron daily) ────────────────────

create or replace function public.update_challenge_statuses()
returns void language plpgsql security definer as $$
declare
  rec record;
begin
  -- upcoming -> active
  update public.challenges set status = 'active'
  where status = 'upcoming' and starts_at <= now();

  -- active -> voting
  update public.challenges set status = 'voting'
  where status = 'active' and ends_at <= now();

  -- voting -> completed + award badges
  for rec in
    select id from public.challenges
    where status = 'voting' and voting_ends_at <= now()
  loop
    update public.challenges set status = 'completed' where id = rec.id;
    perform public.award_challenge_badges(rec.id);
  end loop;
end;
$$;

-- ── Seed: system badges ───────────────────────────────────────────────────────

insert into public.badges (slug, name, description, icon) values
  ('challenge_winner', 'Mistrz Wyzwania', 'Zwycięzca tygodniowego wyzwania', '🏆'),
  ('top_10',           'Top 10',          'Top 10 w wyzwaniu',                '🥈'),
  ('most_creative',    'Najbardziej Kreatywny', 'Wyróżnienie za kreatywność', '✨'),
  ('first_challenge',  'Debiut',          'Pierwsza submisja w wyzwaniu',     '🎯')
on conflict (slug) do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.challenges              enable row level security;
alter table public.challenge_submissions   enable row level security;
alter table public.challenge_votes         enable row level security;
alter table public.challenge_proposals     enable row level security;
alter table public.challenge_proposal_votes enable row level security;
alter table public.badges                  enable row level security;
alter table public.user_badges             enable row level security;

-- challenges: public read
create policy "challenges_select_anon" on public.challenges
  for select to anon using (true);
create policy "challenges_select_auth" on public.challenges
  for select to authenticated using (true);

-- submissions: public read, auth insert (own)
create policy "submissions_select_anon" on public.challenge_submissions
  for select to anon using (true);
create policy "submissions_select_auth" on public.challenge_submissions
  for select to authenticated using (true);
create policy "submissions_insert_auth" on public.challenge_submissions
  for insert to authenticated with check (auth.uid() = user_id);

-- challenge_votes: auth only
create policy "challenge_votes_select_auth" on public.challenge_votes
  for select to authenticated using (true);
create policy "challenge_votes_insert_auth" on public.challenge_votes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "challenge_votes_delete_auth" on public.challenge_votes
  for delete to authenticated using (auth.uid() = user_id);

-- proposals: public read, auth insert (own), auth update (own)
create policy "proposals_select_anon" on public.challenge_proposals
  for select to anon using (true);
create policy "proposals_select_auth" on public.challenge_proposals
  for select to authenticated using (true);
create policy "proposals_insert_auth" on public.challenge_proposals
  for insert to authenticated with check (auth.uid() = user_id);

-- proposal_votes: auth only
create policy "proposal_votes_select_auth" on public.challenge_proposal_votes
  for select to authenticated using (true);
create policy "proposal_votes_insert_auth" on public.challenge_proposal_votes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "proposal_votes_delete_auth" on public.challenge_proposal_votes
  for delete to authenticated using (auth.uid() = user_id);

-- badges: public read
create policy "badges_select_anon"    on public.badges for select to anon       using (true);
create policy "badges_select_auth"    on public.badges for select to authenticated using (true);
create policy "user_badges_select_anon" on public.user_badges for select to anon using (true);
create policy "user_badges_select_auth" on public.user_badges for select to authenticated using (true);
