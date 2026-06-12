import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/services/token-optimizer.service', () => ({
  countTokens: (text: string) => Math.ceil(text.length / 4),
  costPer1kCalls: (tokens: number, costPerMillion: number) =>
    (tokens / 1_000_000) * costPerMillion * 1000,
  MODEL_PRICING: [{ model: 'gpt-4o', label: 'GPT-4o', inputCostPerMillion: 5 }],
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { TokenOptimizerModal } from '../TokenOptimizerModal';

const defaultProps = {
  open: true,
  lang: 'en' as const,
  content: 'This is a test prompt content that has some tokens.',
  onApply: vi.fn(),
  onClose: vi.fn(),
};

describe('TokenOptimizerModal', () => {
  it('renders title', () => {
    render(<TokenOptimizerModal {...defaultProps} />);
    expect(screen.getByText('Token Optimizer')).toBeTruthy();
  });

  it('renders mode buttons', () => {
    render(<TokenOptimizerModal {...defaultProps} />);
    expect(screen.getByText('Conservative')).toBeTruthy();
    expect(screen.getByText('Aggressive')).toBeTruthy();
  });

  it('renders original label', () => {
    render(<TokenOptimizerModal {...defaultProps} />);
    expect(screen.getByText(/Original:/)).toBeTruthy();
  });

  it('renders optimize and cancel buttons', () => {
    render(<TokenOptimizerModal {...defaultProps} />);
    expect(screen.getByText('Optimize')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('Apply button is disabled before optimization', () => {
    render(<TokenOptimizerModal {...defaultProps} />);
    const applyBtn = screen.getByText('Apply') as HTMLButtonElement;
    expect(applyBtn.closest('button')?.disabled).toBe(true);
  });

  it('calls fetch on Optimize click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          optimized: 'shorter prompt',
          originalTokens: 12,
          optimizedTokens: 9,
          savedPercent: 25,
          explanation: 'Removed filler words.',
        },
      }),
    });
    render(<TokenOptimizerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Optimize'));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/prompts/optimize',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows savings after successful optimization', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          optimized: 'shorter prompt',
          originalTokens: 12,
          optimizedTokens: 9,
          savedPercent: 25,
          explanation: 'Removed filler words.',
        },
      }),
    });
    render(<TokenOptimizerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Optimize'));
    await waitFor(() => {
      expect(screen.getByText(/Saved/)).toBeTruthy();
      expect(screen.getByText('Removed filler words.')).toBeTruthy();
    });
  });

  it('shows error message on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Optimization failed' }),
    });
    render(<TokenOptimizerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Optimize'));
    await waitFor(() => {
      expect(screen.getByText('Optimization failed')).toBeTruthy();
    });
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<TokenOptimizerModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Polish title', () => {
    render(<TokenOptimizerModal {...defaultProps} lang="pl" />);
    expect(screen.getByText('Optymalizator tokenów')).toBeTruthy();
  });
});
