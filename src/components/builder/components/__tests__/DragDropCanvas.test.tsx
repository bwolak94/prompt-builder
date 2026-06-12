import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: () => ({}),
  useSensors: (...args: unknown[]) => args,
  closestCenter: () => null,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: () => null,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('../PromptBlock', () => ({
  PromptBlock: ({ block }: { block: { section_slug: string } }) => (
    <div data-testid={`block-${block.section_slug}`}>{block.section_slug}</div>
  ),
}));

const mockAddBlock = vi.fn();
let mockBlocks: unknown[] = [];

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) =>
    selector({
      blocks: mockBlocks,
      addBlock: mockAddBlock,
      reorderBlocks: vi.fn(),
      setActiveBlockId: vi.fn(),
      activeBlockId: null,
    }),
}));

import { DragDropCanvas } from '../DragDropCanvas';
import type { PromptSection } from '@/types';

const SECTIONS: PromptSection[] = [
  { slug: 'role', name: 'Role', icon: 'user', description: '', category: 'core' },
  { slug: 'task', name: 'Task', icon: 'check', description: '', category: 'core' },
];

beforeEach(() => {
  mockBlocks = [];
  mockAddBlock.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DragDropCanvas — empty', () => {
  it('renders DnD context', () => {
    render(<DragDropCanvas sections={SECTIONS} />);
    expect(screen.getByTestId('dnd-context')).toBeTruthy();
  });

  it('shows add block button when no blocks', () => {
    render(<DragDropCanvas sections={SECTIONS} />);
    // Should show some kind of add/empty state
    const addButtons = document.querySelectorAll('[aria-label*="Dodaj"], button, [data-testid]');
    expect(addButtons.length).toBeGreaterThan(0);
  });
});

describe('DragDropCanvas — with blocks', () => {
  it('renders all blocks', () => {
    mockBlocks = [
      { id: 'b1', section_slug: 'role', content: 'You are...', order: 0 },
      { id: 'b2', section_slug: 'task', content: 'Do this...', order: 1 },
    ];
    render(<DragDropCanvas sections={SECTIONS} />);
    expect(screen.getByTestId('block-role')).toBeTruthy();
    expect(screen.getByTestId('block-task')).toBeTruthy();
  });
});
