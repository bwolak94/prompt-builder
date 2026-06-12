import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/components/collections/CollectionsSidebar', () => ({
  CollectionsSidebar: () => <div data-testid="collections-sidebar" />,
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { DashboardIsland } from '../DashboardIsland';
import type { Prompt } from '@/types';

const STATS = {
  total: 3,
  public: 2,
  forks: 5,
  avgScore: 75,
};

const PROMPT: Prompt = {
  id: 'p1',
  user_id: 'u1',
  title: 'My Test Prompt',
  description: null,
  content_md: '',
  is_public: true,
  slug: 'my-test-prompt',
  category: 'coding',
  difficulty: 'intermediate',
  tags: ['python'],
  fork_count: 2,
  fork_of: null,
  view_count: 10,
  blocks: [],
  variables: [],
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('DashboardIsland', () => {
  it('renders new prompt link', () => {
    render(<DashboardIsland initialPrompts={[PROMPT]} initialStats={STATS} lang="en" />);
    // There are 2 links to /builder (desktop + FAB), getByRole('link', name) targets the desktop one
    expect(screen.getAllByText('New prompt').length).toBeGreaterThan(0);
  });

  it('renders stats section', () => {
    render(<DashboardIsland initialPrompts={[PROMPT]} initialStats={STATS} lang="en" />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders filter bar tablist', () => {
    render(<DashboardIsland initialPrompts={[PROMPT]} initialStats={STATS} lang="en" />);
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('renders prompt cards', () => {
    render(<DashboardIsland initialPrompts={[PROMPT]} initialStats={STATS} lang="en" />);
    expect(screen.getByText('My Test Prompt')).toBeTruthy();
  });

  it('renders empty state when no prompts', () => {
    render(
      <DashboardIsland
        initialPrompts={[]}
        initialStats={{ total: 0, public: 0, forks: 0, avgScore: 0 }}
        lang="en"
      />,
    );
    // EmptyState shows "Nie masz jeszcze żadnych promptów" (hardcoded PL in EmptyState)
    expect(screen.getByText(/Nie masz|brak|promptów/i)).toBeTruthy();
  });

  it('renders Polish new prompt text when lang=pl', () => {
    render(
      <DashboardIsland
        initialPrompts={[]}
        initialStats={{ total: 0, public: 0, forks: 0, avgScore: 0 }}
        lang="pl"
      />,
    );
    expect(screen.getAllByText('Nowy prompt').length).toBeGreaterThan(0);
  });
});
