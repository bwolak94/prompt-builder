import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Dialog to auto-trigger onOpenChange(true) so fetchExport fires on mount
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

import { ExportModal } from '../ExportModal';

const defaultProps = {
  open: true,
  chainId: 'chain-123',
  isPl: false,
  onClose: vi.fn(),
};

describe('ExportModal', () => {
  it('renders export title', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Export chain')).toBeTruthy();
  });

  it('renders language toggle buttons', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('Node.js (JS)')).toBeTruthy();
  });

  it('fetches export code on open', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: 'print("hello")' } }),
    });
    render(<ExportModal {...defaultProps} />);
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chains/chain-123/export'),
      ),
    );
  });

  it('displays fetched code', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: 'print("hello")' } }),
    });
    render(<ExportModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('print("hello")')).toBeTruthy();
    });
  });

  it('shows loader while fetching', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ExportModal {...defaultProps} />);
    await waitFor(() => {
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeTruthy();
    });
  });

  it('fetches JavaScript when Node.js button clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { code: 'console.log()' } }),
    });
    render(<ExportModal {...defaultProps} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    mockFetch.mockClear();
    fireEvent.click(screen.getByText('Node.js (JS)'));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('lang=javascript')),
    );
  });

  it('renders Polish title when isPl=true', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ExportModal {...defaultProps} isPl={true} />);
    expect(screen.getByText('Eksportuj łańcuch')).toBeTruthy();
  });

  it('renders close button', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Close')).toBeTruthy();
  });
});
