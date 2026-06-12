import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/services/import.service', () => ({
  withIds: (blocks: unknown[]) => blocks,
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { ImportModal } from '../ImportModal';

const defaultProps = {
  open: true,
  lang: 'pl' as const,
  onImport: vi.fn(),
  onClose: vi.fn(),
};

describe('ImportModal — input step', () => {
  it('renders modal title', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText('Importuj prompt')).toBeTruthy();
  });

  it('renders Szybki parse mode button', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText('Szybki')).toBeTruthy();
  });

  it('renders AI parse mode button', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByText('AI (dokładniejszy)')).toBeTruthy();
  });

  it('renders textarea for prompt input', () => {
    render(<ImportModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Wklej tutaj/)).toBeTruthy();
  });

  it('Parse button is disabled when textarea is empty', () => {
    render(<ImportModal {...defaultProps} />);
    const btn = screen.getByText('Parsuj') as HTMLButtonElement;
    expect(btn.closest('button')?.disabled).toBe(true);
  });

  it('Parse button enabled after typing', () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'Some prompt text' },
    });
    const btn = screen.getByText('Parsuj') as HTMLButtonElement;
    expect(btn.closest('button')?.disabled).toBe(false);
  });

  it('shows character count', () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'hello' },
    });
    expect(screen.getByText(/5/)).toBeTruthy();
  });

  it('calls fetch on Parse button click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { title: 'Imported Prompt', blocks: [] },
      }),
    });
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'Some prompt text' },
    });
    fireEvent.click(screen.getByText('Parsuj'));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/import/parse',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});

describe('ImportModal — preview step', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          title: 'My Imported Prompt',
          blocks: [{ section_slug: 'role', content: 'You are an assistant.' }],
        },
      }),
    });
  });

  it('shows preview step after successful parse', async () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'Some prompt text' },
    });
    fireEvent.click(screen.getByText('Parsuj'));
    await waitFor(() => {
      expect(screen.getByText('Podgląd sekcji')).toBeTruthy();
    });
  });

  it('shows parsed title in preview', async () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'Some prompt text' },
    });
    fireEvent.click(screen.getByText('Parsuj'));
    await waitFor(() => {
      expect(screen.getByText('My Imported Prompt')).toBeTruthy();
    });
  });

  it('shows block preview with section label', async () => {
    render(<ImportModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Wklej tutaj/), {
      target: { value: 'Some prompt text' },
    });
    fireEvent.click(screen.getByText('Parsuj'));
    await waitFor(() => {
      expect(screen.getByText('Role')).toBeTruthy();
      expect(screen.getByText('You are an assistant.')).toBeTruthy();
    });
  });
});

describe('ImportModal — English', () => {
  it('renders English title', () => {
    render(<ImportModal {...defaultProps} lang="en" />);
    expect(screen.getByText('Import prompt')).toBeTruthy();
  });

  it('renders English AI mode button', () => {
    render(<ImportModal {...defaultProps} lang="en" />);
    expect(screen.getByText('AI (accurate)')).toBeTruthy();
  });
});
