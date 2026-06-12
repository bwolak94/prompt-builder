import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useCommunityFeed', () => ({
  useCommunityFeed: (initial: unknown[], _cursor: unknown) => ({
    items: initial,
    isLoading: false,
    isFetchingMore: false,
    hasMore: false,
    tab: 'trending',
    filters: { category: '', search: '' },
    setTab: vi.fn(),
    setFilters: vi.fn(),
    loadMore: vi.fn(),
    sentinelRef: { current: null },
  }),
}));

import { CommunityFeedIsland } from '../CommunityFeedIsland';
import type { TrendingPrompt } from '@/db/repositories/community-feed.repo';

const PROMPT: TrendingPrompt = {
  id: 'p1',
  user_id: 'u1',
  title: 'Amazing Prompt',
  description: null,
  tags: ['python'],
  fork_count: 5,
  view_count: 100,
  avg_rating: 4.5,
  rating_count: 10,
  comment_count: 3,
  is_featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  trending_score: 85,
  author_name: 'Alice',
  author_avatar: null,
};

describe('CommunityFeedIsland', () => {
  it('renders community title in English', () => {
    render(
      <CommunityFeedIsland
        lang="en"
        initialItems={[]}
        initialNextCursor={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText(/Community/i)).toBeTruthy();
  });

  it('renders community title in Polish', () => {
    render(
      <CommunityFeedIsland
        lang="pl"
        initialItems={[]}
        initialNextCursor={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText(/Społeczność|Community/i)).toBeTruthy();
  });

  it('renders feed tab buttons', () => {
    render(
      <CommunityFeedIsland
        lang="en"
        initialItems={[]}
        initialNextCursor={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText(/Trending/i)).toBeTruthy();
    expect(screen.getByText(/Recent/i)).toBeTruthy();
  });

  it('renders prompt items', () => {
    render(
      <CommunityFeedIsland
        lang="en"
        initialItems={[PROMPT]}
        initialNextCursor={null}
        isLoggedIn={true}
      />,
    );
    expect(screen.getByText('Amazing Prompt')).toBeTruthy();
  });
});
