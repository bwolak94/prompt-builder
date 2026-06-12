import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ImproveVariant } from '@/lib/services/auto-improve.service';

// Mock Dialog to auto-trigger onOpenChange(true) so handleFetch fires on mount
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
    children?: React.ReactNode;
  }) => {
    React.useEffect(() => {
      if (open && onOpenChange) onOpenChange(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return open ? <div>{children}</div> : null;
  },
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { ImproveModal } from '../ImproveModal';

const VARIANTS: ImproveVariant[] = [
  { id: 'concise', label: 'Concise', content: 'Short version', explanation: 'Fewer words' },
  { id: 'precise', label: 'Precise', content: 'Detailed version', explanation: 'More precise' },
  {
    id: 'structured',
    label: 'Structured',
    content: 'Structured version',
    explanation: 'Better flow',
  },
];

const defaultProps = {
  open: true,
  lang: 'en' as const,
  mode: 'block' as const,
  content: 'Original content',
  onApply: vi.fn(),
  onClose: vi.fn(),
};

describe('ImproveModal — loading state', () => {
  it('shows loading text while fetching', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ImproveModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/AI is improving the prompt/i)).toBeTruthy();
    });
  });
});

describe('ImproveModal — with variants', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { variants: VARIANTS } }),
    });
  });

  it('renders variant cards after fetch', async () => {
    render(<ImproveModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Concise')).toBeTruthy();
      expect(screen.getByText('Precise')).toBeTruthy();
      expect(screen.getByText('Structured')).toBeTruthy();
    });
  });

  it('shows apply and cancel buttons after fetch', async () => {
    render(<ImproveModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Apply')).toBeTruthy();
      expect(screen.getByText('Cancel')).toBeTruthy();
    });
  });

  it('calls onApply with first variant content by default', async () => {
    const onApply = vi.fn();
    render(<ImproveModal {...defaultProps} onApply={onApply} />);
    await waitFor(() => screen.getByText('Concise'));
    fireEvent.click(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith('Short version');
  });
});

describe('ImproveModal — error state', () => {
  it('shows error message and retry button', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });
    render(<ImproveModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });
});

describe('ImproveModal — Polish', () => {
  it('shows Polish title for block mode', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ImproveModal {...defaultProps} lang="pl" mode="block" />);
    await waitFor(() => {
      expect(screen.getByText('Ulepsz blok')).toBeTruthy();
    });
  });

  it('shows Polish title for full mode', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ImproveModal {...defaultProps} lang="pl" mode="full" />);
    await waitFor(() => {
      expect(screen.getByText('Ulepsz cały prompt')).toBeTruthy();
    });
  });
});
