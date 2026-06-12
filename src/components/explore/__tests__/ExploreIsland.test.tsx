import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useTemplates', () => ({
  useTemplates: (initial: unknown[]) => ({
    templates: initial,
    isLoading: false,
    isFetchingMore: false,
    nextCursor: null,
    error: null,
    filters: { search: '', category: '', difficulty: '' },
    updateFilters: vi.fn(),
    fetchMore: vi.fn(),
  }),
}));

// Mock IntersectionObserver
beforeEach(() => {
  const mockObserver = { observe: vi.fn(), disconnect: vi.fn() };
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => mockObserver),
  );
});

import { ExploreIsland } from '../ExploreIsland';
import type { SystemTemplate } from '@/db/repositories/template.repo';

const TEMPLATE: SystemTemplate = {
  id: 't1',
  title: 'Code Review',
  title_en: 'Code Review',
  description: 'Review code',
  description_en: 'Review code',
  content_md: 'Review this: {{code}}',
  category: 'coding',
  difficulty: 'intermediate',
  tags: ['code'],
  blocks: [],
  variables: [],
  is_featured: false,
  ai_score: null,
  fork_count: 10,
  order_index: 0,
  created_at: new Date().toISOString(),
};

describe('ExploreIsland', () => {
  it('renders page heading', () => {
    render(<ExploreIsland initialTemplates={[]} lang="en" />);
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeTruthy();
  });

  it('renders search bar', () => {
    render(<ExploreIsland initialTemplates={[]} lang="en" />);
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });

  it('renders template cards from initial data', () => {
    render(<ExploreIsland initialTemplates={[TEMPLATE]} lang="en" />);
    expect(screen.getByText('Code Review')).toBeTruthy();
  });

  it('renders heading for Polish lang', () => {
    render(<ExploreIsland initialTemplates={[]} lang="pl" />);
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeTruthy();
  });
});
