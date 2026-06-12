import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
}));

let mockPromptId: string | null = 'prompt-123';

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => selector({ promptId: mockPromptId }),
}));

const mockCreateTest = vi.fn();
const mockUpdateVariantB = vi.fn();
const mockScoreOffline = vi.fn();
const mockRunLive = vi.fn();
const mockCancelRun = vi.fn();
const mockApplyWinner = vi.fn();
const mockExitABMode = vi.fn();

let mockTest: unknown = null;
let mockStatus = 'idle';
let mockError: string | null = null;
let mockIsRunning = false;
let mockIsScoring = false;

vi.mock('../../hooks/useABTest', () => ({
  useABTest: () => ({
    test: mockTest,
    status: mockStatus,
    error: mockError,
    variantBBlocks: [],
    responseA: '',
    responseB: '',
    scoreA: null,
    scoreB: null,
    diff: [],
    isRunning: mockIsRunning,
    isScoring: mockIsScoring,
    createTest: mockCreateTest,
    updateVariantB: mockUpdateVariantB,
    scoreOffline: mockScoreOffline,
    runLive: mockRunLive,
    cancelRun: mockCancelRun,
    applyWinner: mockApplyWinner,
    exitABMode: mockExitABMode,
  }),
}));

import { ABTestView } from '../ABTestView';
import type { PromptSection } from '@/types';

const SECTIONS: PromptSection[] = [
  { slug: 'role', name: 'Role', icon: 'user', description: '', category: 'core' },
];

const defaultProps = {
  sections: SECTIONS,
  lang: 'en' as const,
  onExit: vi.fn(),
};

beforeEach(() => {
  mockTest = null;
  mockStatus = 'idle';
  mockError = null;
  mockIsRunning = false;
  mockIsScoring = false;
  mockPromptId = 'prompt-123';
  mockCreateTest.mockClear();
  mockExitABMode.mockClear();
  defaultProps.onExit.mockClear?.();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ABTestView — no test started', () => {
  it('renders enter A/B mode description', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Compare two prompt variants side-by-side.')).toBeTruthy();
  });

  it('renders A/B Mode button', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('A/B Mode')).toBeTruthy();
  });

  it('renders cancel button', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('calls createTest when enter button clicked', async () => {
    mockCreateTest.mockResolvedValue(undefined);
    render(<ABTestView {...defaultProps} />);
    fireEvent.click(screen.getByText('A/B Mode'));
    expect(mockCreateTest).toHaveBeenCalledWith('prompt-123');
  });
});

describe('ABTestView — test active', () => {
  beforeEach(() => {
    mockTest = {
      id: 'test-1',
      variant_a: { blocks: [] },
    };
  });

  it('renders A/B badge', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('A/B')).toBeTruthy();
  });

  it('renders Score both button', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Score both')).toBeTruthy();
  });

  it('renders Run both button', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Run both')).toBeTruthy();
  });

  it('renders Exit A/B button', () => {
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Exit A/B')).toBeTruthy();
  });

  it('shows Stop button when running', () => {
    mockIsRunning = true;
    render(<ABTestView {...defaultProps} />);
    expect(screen.getByText('Stop')).toBeTruthy();
  });
});
