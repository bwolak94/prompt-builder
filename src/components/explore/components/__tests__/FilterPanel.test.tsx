import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Radix Tabs so onValueChange fires on click
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    value,
    onValueChange: _onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <div data-value={value} data-testid="tabs">
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({
    value,
    children,
    ...props
  }: { value: string; children: React.ReactNode } & Record<string, unknown>) => {
    // Find the onValueChange from the closest parent Tabs via a data attribute approach
    // Instead, directly receive and call from parent context via a custom render
    return (
      <button
        role="tab"
        data-value={value}
        onClick={() => {
          // Bubble up via a custom event
          const el = document.querySelector('[data-testid="tabs"]');
          el?.dispatchEvent(new CustomEvent('tabchange', { detail: value, bubbles: true }));
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
}));

import { FilterPanel } from '../FilterPanel';

describe('FilterPanel', () => {
  it('renders category tabs with English labels when lang=en', () => {
    render(
      <FilterPanel
        category="all"
        difficulty="all"
        onCategoryChange={() => {}}
        onDifficultyChange={() => {}}
        lang="en"
      />,
    );
    expect(screen.getByText('All categories')).toBeTruthy();
    expect(screen.getByText('Coding')).toBeTruthy();
    expect(screen.getByText('Writing')).toBeTruthy();
    expect(screen.getByText('Analysis')).toBeTruthy();
    expect(screen.getByText('Roleplay')).toBeTruthy();
  });

  it('renders difficulty options with English labels when lang=en', () => {
    render(
      <FilterPanel
        category="all"
        difficulty="all"
        onCategoryChange={() => {}}
        onDifficultyChange={() => {}}
        lang="en"
      />,
    );
    expect(screen.getByText('All levels')).toBeTruthy();
  });

  it('renders Polish labels when lang=pl', () => {
    render(
      <FilterPanel
        category="all"
        difficulty="all"
        onCategoryChange={() => {}}
        onDifficultyChange={() => {}}
        lang="pl"
      />,
    );
    expect(screen.getByText('Wszystkie kategorie')).toBeTruthy();
  });

  it('renders 5 category tab buttons', () => {
    render(
      <FilterPanel
        category="all"
        difficulty="all"
        onCategoryChange={() => {}}
        onDifficultyChange={() => {}}
        lang="en"
      />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5); // all, coding, writing, analysis, roleplay
  });
});
