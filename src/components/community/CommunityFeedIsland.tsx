/**
 * CommunityFeedIsland — F-06
 * Public community feed with tabs, filters, and infinite scroll.
 * Renders as a React island (client:load).
 */

import React, { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { TrendingPrompt, FeedTab, FeedPeriod } from '@/db/repositories/community-feed.repo';
import { useCommunityFeed } from './hooks/useCommunityFeed';

interface CommunityFeedIslandProps {
  lang: Lang;
  initialItems: TrendingPrompt[];
  initialNextCursor: string | null;
  isLoggedIn: boolean;
}

const CATEGORIES = ['coding', 'writing', 'analysis', 'roleplay'];

export const CommunityFeedIsland: React.FC<CommunityFeedIslandProps> = ({
  lang,
  initialItems,
  initialNextCursor,
  isLoggedIn,
}) => {
  const { t } = useI18n(lang);
  const {
    items,
    isLoading,
    isFetchingMore,
    hasMore,
    tab,
    filters,
    setTab,
    setFilters,
    loadMore,
    sentinelRef,
  } = useCommunityFeed(initialItems, initialNextCursor);

  const tabs: Array<{ id: FeedTab; label: string }> = [
    { id: 'trending', label: t('community.tabs.trending') },
    { id: 'recent',   label: t('community.tabs.recent') },
    { id: 'top_rated', label: t('community.tabs.topRated') },
    { id: 'featured', label: t('community.tabs.featured') },
  ];

  const periods: Array<{ id: FeedPeriod; label: string }> = [
    { id: '24h',   label: t('community.period.h24') },
    { id: 'week',  label: t('community.period.week') },
    { id: 'month', label: t('community.period.month') },
    { id: 'all',   label: t('community.period.all') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('community.title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('community.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label={t('community.title')}
        className="flex gap-1 rounded-lg border border-border bg-surface-raised p-1"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-brand-500 text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-400"
          aria-label={t('filters.category')}
        >
          <option value="">{t('filters.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`filters.${c}` as Parameters<typeof t>[0])}</option>
          ))}
        </select>

        {/* Period (hidden for featured tab) */}
        {tab !== 'featured' && (
          <div className="flex gap-1">
            {periods.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilters({ period: id })}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  filters.period === id
                    ? 'bg-surface-overlay text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div
        className={`transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        role="tabpanel"
      >
        {items.length === 0 && !isLoading ? (
          <p className="py-12 text-center text-sm text-text-muted">{t('community.noResults')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((prompt) => (
              <PromptFeedCard
                key={prompt.id}
                prompt={prompt}
                isLoggedIn={isLoggedIn}
                forkLabel={t('community.forkThis')}
                byLabel={t('community.by')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel + manual Load More fallback */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => void loadMore()}
            disabled={isFetchingMore}
            className="rounded-lg border border-border px-6 py-2 text-sm text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
          >
            {isFetchingMore ? t('common.loading') : t('community.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

// ── PromptFeedCard ────────────────────────────────────────────────────────────

interface CardProps {
  prompt: TrendingPrompt;
  isLoggedIn: boolean;
  forkLabel: string;
  byLabel: string;
}

const PromptFeedCard: React.FC<CardProps> = React.memo(({ prompt, isLoggedIn, forkLabel, byLabel }) => {
  const forkUrl = isLoggedIn
    ? `/builder?template=${prompt.id}`
    : `/register?fork=${prompt.id}`;

  const formatDate = useCallback((iso: string) =>
    new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'days',
    ), []);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-shadow hover:shadow-md">
      {/* Featured badge */}
      {prompt.is_featured && (
        <span className="w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
          ✦ Featured
        </span>
      )}

      {/* Author */}
      <div className="flex items-center gap-2">
        {prompt.author_avatar ? (
          <img
            src={prompt.author_avatar}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-400">
            {(prompt.author_name ?? 'A')[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-[11px] text-text-muted">
          {byLabel} <span className="font-medium text-text-secondary">{prompt.author_name}</span>
          {' · '}
          <time dateTime={prompt.created_at}>{formatDate(prompt.created_at)}</time>
        </span>
      </div>

      {/* Title + Description */}
      <div className="flex-1">
        <a
          href={`/p/${prompt.id}`}
          className="line-clamp-2 font-semibold text-text-primary transition-colors hover:text-brand-400"
        >
          {prompt.title}
        </a>
        {prompt.description && (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{prompt.description}</p>
        )}
      </div>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {prompt.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-overlay px-1.5 py-0.5 text-[10px] text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          {prompt.avg_rating > 0 && (
            <span title="Average rating">⭐ {prompt.avg_rating.toFixed(1)}</span>
          )}
          {prompt.fork_count > 0 && (
            <span title="Forks">🔀 {prompt.fork_count}</span>
          )}
          {prompt.view_count > 0 && (
            <span title="Views">👁 {prompt.view_count}</span>
          )}
        </div>

        <a
          href={forkUrl}
          className="rounded-lg bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 transition-colors hover:bg-brand-500/20"
        >
          {forkLabel}
        </a>
      </div>
    </article>
  );
});

PromptFeedCard.displayName = 'PromptFeedCard';

export default CommunityFeedIsland;
