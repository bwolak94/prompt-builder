import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PromptBlock as PromptBlockType, PromptSection } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdateBlockContent = vi.fn();
const mockRemoveBlock = vi.fn();

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => {
    const state = {
      updateBlockContent: mockUpdateBlockContent,
      removeBlock: mockRemoveBlock,
    };
    return selector(state);
  },
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <article {...props}>{children}</article>
    ),
  },
}));

vi.mock('@/lib/constants', () => ({
  getSectionColors: () => ({ bg: '', border: '', text: '' }),
}));

vi.mock('../../hooks/useDynamicIcon', () => ({
  useDynamicIcon: () => null,
}));

vi.mock('../PromptBlockOverlay', () => ({
  PromptBlockOverlay: () => null,
}));

vi.mock('../ImproveModal', () => ({
  ImproveModal: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  TooltipContent: () => null,
}));

import { PromptBlock } from '../PromptBlock';

// ── Data ──────────────────────────────────────────────────────────────────────

const BLOCK: PromptBlockType = {
  id: 'b1',
  section_slug: 'role',
  content: 'Act as an expert.',
  order_index: 0,
};

const SECTION: PromptSection = {
  slug: 'role',
  name: 'Role',
  description: 'Define the AI role.',
  category: 'core',
  icon: 'User',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PromptBlock', () => {
  it('renders the section name in the header', () => {
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={1} />);
    expect(screen.getByText('Role')).toBeTruthy();
  });

  it('renders the block content in the textarea', () => {
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={1} />);
    const textarea = screen.getByRole('textbox', { name: /Treść sekcji Role/i });
    expect((textarea as HTMLTextAreaElement).value).toBe('Act as an expert.');
  });

  it('calls updateBlockContent when textarea changes', () => {
    mockUpdateBlockContent.mockClear();
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={1} />);
    fireEvent.change(screen.getByRole('textbox', { name: /Treść sekcji Role/i }), {
      target: { value: 'New content' },
    });
    expect(mockUpdateBlockContent).toHaveBeenCalledWith('b1', 'New content');
  });

  it('calls removeBlock when delete button is clicked', () => {
    mockRemoveBlock.mockClear();
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={1} />);
    fireEvent.click(screen.getByLabelText('Usuń blok: Role'));
    expect(mockRemoveBlock).toHaveBeenCalledWith('b1');
  });

  it('has accessible article label with position info', () => {
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={3} />);
    expect(screen.getByLabelText(/Blok: Role, pozycja 1 z 3/i)).toBeTruthy();
  });

  it('shows English improve label when lang=en', () => {
    render(<PromptBlock block={BLOCK} section={SECTION} position={1} total={1} lang="en" />);
    expect(screen.getByLabelText('Improve block: Role')).toBeTruthy();
  });
});
