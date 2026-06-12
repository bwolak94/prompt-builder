import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PromptSection } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockAddBlock = vi.fn();
const mockBlocks: { section_slug: string }[] = [];

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => {
    const state = { blocks: mockBlocks, addBlock: mockAddBlock };
    return selector(state);
  },
}));

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    isDragging: false,
  }),
}));

vi.mock('@/lib/constants', () => ({
  getSectionColors: () => ({ bg: '', border: '', text: '' }),
}));

vi.mock('../../hooks/useDynamicIcon', () => ({
  useDynamicIcon: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  TooltipContent: () => null,
}));

import { SectionPalette } from '../SectionPalette';

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTIONS: PromptSection[] = [
  { slug: 'role', name: 'Role', description: 'AI role', category: 'core', icon: 'User' },
  { slug: 'task', name: 'Task', description: 'Main task', category: 'core', icon: 'Target' },
  { slug: 'tone', name: 'Tone', description: 'Response tone', category: 'optional', icon: 'Music' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SectionPalette', () => {
  it('renders "Sekcje" header', () => {
    render(<SectionPalette sections={SECTIONS} />);
    expect(screen.getByText('Sekcje')).toBeTruthy();
  });

  it('renders category group labels', () => {
    render(<SectionPalette sections={SECTIONS} />);
    expect(screen.getByText('Rdzeń')).toBeTruthy();
    expect(screen.getByText('Opcjonalne')).toBeTruthy();
  });

  it('renders all section names', () => {
    render(<SectionPalette sections={SECTIONS} />);
    expect(screen.getByText('Role')).toBeTruthy();
    expect(screen.getByText('Task')).toBeTruthy();
    expect(screen.getByText('Tone')).toBeTruthy();
  });

  it('calls addBlock when a section card is clicked', () => {
    mockAddBlock.mockClear();
    render(<SectionPalette sections={SECTIONS} />);
    fireEvent.click(screen.getByLabelText('Dodaj sekcję: Role'));
    expect(mockAddBlock).toHaveBeenCalledWith('role');
  });

  it('does not render empty category groups', () => {
    render(<SectionPalette sections={SECTIONS} />);
    expect(screen.queryByText('Zaawansowane')).toBeNull();
  });
});
