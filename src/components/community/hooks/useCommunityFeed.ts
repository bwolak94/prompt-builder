import { useState, useCallback, useTransition, useRef, useEffect } from 'react';
import type { TrendingPrompt, FeedTab, FeedPeriod } from '@/db/repositories/community-feed.repo';

interface ActiveFilters {
  category: string;
  period: FeedPeriod;
}

interface UseCommunityFeedReturn {
  items: TrendingPrompt[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  tab: FeedTab;
  filters: ActiveFilters;
  setTab: (tab: FeedTab) => void;
  setFilters: (filters: Partial<ActiveFilters>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

async function fetchFeed(
  tab: FeedTab,
  filters: ActiveFilters,
  cursor?: string,
): Promise<{ items: TrendingPrompt[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ tab });
  if (filters.category) params.set('category', filters.category);
  if (filters.period !== 'all') params.set('period', filters.period);
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/community/feed?${params.toString()}`);
  if (!res.ok) throw new Error('Feed fetch failed');
  const { data } = (await res.json()) as { data: { items: TrendingPrompt[]; nextCursor: string | null } };
  return data;
}

export function useCommunityFeed(
  initialItems: TrendingPrompt[],
  initialNextCursor: string | null,
): UseCommunityFeedReturn {
  const [items, setItems] = useState<TrendingPrompt[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [tab, setTabState] = useState<FeedTab>('trending');
  const [filters, setFiltersState] = useState<ActiveFilters>({ category: '', period: 'all' });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const refresh = useCallback(async (newTab?: FeedTab, newFilters?: ActiveFilters) => {
    const activeTab = newTab ?? tab;
    const activeFilters = newFilters ?? filters;
    startTransition(async () => {
      try {
        const page = await fetchFeed(activeTab, activeFilters);
        setItems(page.items);
        setCursor(page.nextCursor);
      } catch {
        // silently ignore — stale data stays visible
      }
    });
  }, [tab, filters]);

  const setTab = useCallback((newTab: FeedTab) => {
    setTabState(newTab);
    void refresh(newTab, filters);
  }, [refresh, filters]);

  const setFilters = useCallback((partial: Partial<ActiveFilters>) => {
    const newFilters = { ...filters, ...partial };
    setFiltersState(newFilters);
    void refresh(tab, newFilters);
  }, [refresh, tab, filters]);

  const loadMore = useCallback(async () => {
    if (!cursor || isFetchingMore || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsFetchingMore(true);
    try {
      const page = await fetchFeed(tab, filters, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setIsFetchingMore(false);
      isLoadingRef.current = false;
    }
  }, [cursor, tab, filters, isFetchingMore]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !isFetchingMore) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, isFetchingMore, loadMore]);

  return {
    items,
    isLoading: isPending,
    isFetchingMore,
    hasMore: cursor !== null,
    tab,
    filters,
    setTab,
    setFilters,
    loadMore,
    refresh,
    sentinelRef,
  };
}
