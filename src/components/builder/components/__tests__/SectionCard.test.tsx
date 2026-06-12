import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PromptSection } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    isDragging: false,
  }),
}));

vi.mock('@/lib/constants', () => ({
  getSectionColors: () => ({
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
  }),
}));

vi.mock('../../hooks/useDynamicIcon', () => ({
  useDynamicIcon: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));

import { SectionCard } from '../SectionCard';

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTION: PromptSection = {
  slug: 'role',
  name: 'Role',
  description: 'Define the AI role.',
  category: 'core',
  icon: 'User',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SectionCard', () => {
  it('renders the section name', () => {
    render(<SectionCard section={SECTION} isAdded={false} onAdd={() => {}} />);
    expect(screen.getByText('Role')).toBeTruthy();
  });

  it('has accessible aria-label', () => {
    render(<SectionCard section={SECTION} isAdded={false} onAdd={() => {}} />);
    expect(screen.getByLabelText('Dodaj sekcję: Role')).toBeTruthy();
  });

  it('calls onAdd with section slug when clicked', () => {
    const onAdd = vi.fn();
    render(<SectionCard section={SECTION} isAdded={false} onAdd={onAdd} />);
    fireEvent.click(screen.getByLabelText('Dodaj sekcję: Role'));
    expect(onAdd).toHaveBeenCalledWith('role');
  });

  it('shows a checkmark when isAdded is true', () => {
    const { container } = render(<SectionCard section={SECTION} isAdded={true} onAdd={() => {}} />);
    // Check icon is rendered (lucide SVG)
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
