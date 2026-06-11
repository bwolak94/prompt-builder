/**
 * Accessibility tests using axe-core (WCAG 2.1 AA).
 * Covers: Dashboard island skeleton, Builder toolbar, Landing page sections.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { AxeResults } from 'axe-core';
import { describe, it, expect, vi, beforeAll } from 'vitest';

expect.extend(toHaveNoViolations);

// jest-axe adds toHaveNoViolations at runtime via expect.extend;
// cast helper bridges the type gap without changing runtime behaviour
const axeExpect = (r: AxeResults) =>
  expect(r) as unknown as { toHaveNoViolations(): Promise<void> };

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/components/builder/store/builder.store', () => ({
  useBuilderStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      title: 'Test prompt',
      isPublic: false,
      isDirty: false,
      isSaving: false,
      blocks: [],
      variables: {},
      detectedVariables: [],
      activeBlockId: null,
      setTitle: vi.fn(),
      setIsPublic: vi.fn(),
      save: vi.fn(),
    }),
  ),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false }),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: class {},
  KeyboardSensor: class {},
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {}, listeners: {}, setNodeRef: vi.fn(),
    transform: null, transition: null, isDragging: false,
  }),
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
      <article {...props}>{children}</article>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('a11y: BuilderToolbar', () => {
  it('has no axe violations', async () => {
    const { BuilderToolbar } = await import('@/components/builder/components/BuilderToolbar');
    const { container } = render(<BuilderToolbar />);
    const results = await axe(container);
    await axeExpect(results).toHaveNoViolations();
  });
});

describe('a11y: EmptyState (Dashboard)', () => {
  it('has no axe violations', async () => {
    const { EmptyState } = await import('@/components/dashboard/components/EmptyState');
    const { container } = render(<EmptyState filter="all" />);
    const results = await axe(container);
    await axeExpect(results).toHaveNoViolations();
  });
});

describe('a11y: StatsRow (Dashboard)', () => {
  it('has no axe violations', async () => {
    const { StatsRow } = await import('@/components/dashboard/components/StatsRow');
    const stats = { total: 5, public: 2, forks: 1, avgScore: 75 };
    const { container } = render(<StatsRow stats={stats} />);
    const results = await axe(container);
    await axeExpect(results).toHaveNoViolations();
  });
});

describe('a11y: FilterBar (Dashboard)', () => {
  it('has no axe violations', async () => {
    const { FilterBar } = await import('@/components/dashboard/components/FilterBar');
    const counts = { all: 5, public: 2, private: 3, unscored: 1 };
    const { container } = render(
      <FilterBar active="all" counts={counts} onChange={vi.fn()} />,
    );
    const results = await axe(container);
    await axeExpect(results).toHaveNoViolations();
  });
});

describe('a11y: ScoreStreamLoader', () => {
  it('has no axe violations', async () => {
    const { ScoreStreamLoader } = await import('@/components/ai-score/components/ScoreStreamLoader');
    const { container } = render(<ScoreStreamLoader />);
    const results = await axe(container);
    await axeExpect(results).toHaveNoViolations();
  });
});
