import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useChainBuilder', () => ({
  useChainBuilder: (chain: { title: string; description: string }) => ({
    nodes: [],
    title: chain.title,
    description: chain.description,
    isSaving: false,
    isPending: false,
    setTitle: vi.fn(),
    setDescription: vi.fn(),
    addNode: vi.fn(),
    removeNode: vi.fn(),
    updateNode: vi.fn(),
    moveNode: vi.fn(),
    saveAll: vi.fn(),
  }),
}));

vi.mock('../hooks/useChainRun', () => ({
  useChainRun: () => ({
    nodeStates: [],
    isRunning: false,
    runChain: vi.fn(),
    cancelRun: vi.fn(),
    resetRun: vi.fn(),
  }),
}));

vi.mock('@/lib/ai/run-provider.factory', () => ({
  RUN_PROVIDER_MODELS: {
    anthropic: ['claude-haiku-4-5-20251001'],
    openai: ['gpt-4o-mini'],
  },
}));

vi.mock('../components/ExportModal', () => ({
  ExportModal: () => null,
}));

vi.mock('../components/ChainNodeCard', () => ({
  ChainNodeCard: () => <div data-testid="chain-node-card" />,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ChainBuilderIsland } from '../ChainBuilderIsland';
import type { PromptChainWithNodes } from '@/db/repositories/chain.repo';

const CHAIN: PromptChainWithNodes = {
  id: 'ch1',
  user_id: 'u1',
  title: 'My Chain',
  description: 'A test chain',
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  nodes: [],
};

describe('ChainBuilderIsland', () => {
  it('renders chain title in input', () => {
    render(<ChainBuilderIsland chain={CHAIN} lang="pl" />);
    const input = screen.getByDisplayValue('My Chain');
    expect(input).toBeTruthy();
  });

  it('renders back button', () => {
    render(<ChainBuilderIsland chain={CHAIN} lang="pl" />);
    expect(screen.getByLabelText(/Wróć|Back/i)).toBeTruthy();
  });

  it('renders save button', () => {
    render(<ChainBuilderIsland chain={CHAIN} lang="pl" />);
    expect(screen.getByText(/Zapisz|Save/i)).toBeTruthy();
  });

  it('renders add node button', () => {
    render(<ChainBuilderIsland chain={CHAIN} lang="pl" />);
    expect(screen.getByText(/Dodaj krok|Add step/i)).toBeTruthy();
  });

  it('renders "No steps yet" empty state', () => {
    render(<ChainBuilderIsland chain={CHAIN} lang="en" />);
    expect(screen.getByText('No steps yet')).toBeTruthy();
  });
});
