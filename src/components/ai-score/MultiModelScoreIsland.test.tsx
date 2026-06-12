import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiModelScoreIsland } from './MultiModelScoreIsland';

// ── Fetch mock ─────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const DEFAULT_PROPS = {
  promptId: 'p1',
  content: 'You are a helpful assistant.',
  isPl: false,
};

// ── Idle state ─────────────────────────────────────────────────────────────────

describe('MultiModelScoreIsland — idle', () => {
  it('renders the "Multi-Model Scoring" heading', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    expect(screen.getByText('Multi-Model Scoring')).toBeTruthy();
  });

  it('renders provider checkboxes for openai and anthropic', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    // Both providers start checked
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((cb) => expect((cb as HTMLInputElement).checked).toBe(true));
  });

  it('renders the "Compare models" button', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /compare models/i })).toBeTruthy();
  });

  it('shows Polish text when isPl=true', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} isPl={true} />);
    expect(screen.getByText('Porównanie modeli')).toBeTruthy();
  });
});

// ── Loading state ──────────────────────────────────────────────────────────────

describe('MultiModelScoreIsland — loading', () => {
  it('shows loading indicator while fetch is pending', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText(/Scoring with/i)).toBeTruthy();
    });
  });
});

// ── Error state ────────────────────────────────────────────────────────────────

describe('MultiModelScoreIsland — error', () => {
  it('shows error message on failed fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Service unavailable' }),
    });

    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText('Service unavailable')).toBeTruthy();
    });
  });

  it('shows limit-reached message when code is MULTI_SCORE_LIMIT', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ code: 'MULTI_SCORE_LIMIT', error: 'Limit reached' }),
    });

    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText(/Monthly multi-model scoring limit reached/i)).toBeTruthy();
    });
  });

  it('shows connection error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection error')).toBeTruthy();
    });
  });
});

// ── Provider toggle ────────────────────────────────────────────────────────────

describe('MultiModelScoreIsland — provider toggle', () => {
  it('unchecking a provider removes it from selection', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    // Uncheck first provider (openai)
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0].checked).toBe(false);
  });

  it('cannot uncheck the last remaining provider', () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    // Uncheck first, then try to uncheck second
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    // Second checkbox should remain checked (can't have 0 providers)
    expect(checkboxes[1].checked).toBe(true);
  });
});

// ── Done state (mocked results) ────────────────────────────────────────────────

const MOCK_RESULTS = [
  {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    score: {
      overall: 82,
      dimensions: {
        clarity: { score: 80, comment: 'ok', suggestions: [] },
        specificity: { score: 85, comment: 'ok', suggestions: [] },
        structure: { score: 78, comment: 'ok', suggestions: [] },
        tone: { score: 82, comment: 'ok', suggestions: [] },
        completeness: { score: 85, comment: 'ok', suggestions: [] },
      },
    },
    durationMs: 1000,
  },
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5-20251001',
    score: {
      overall: 79,
      dimensions: {
        clarity: { score: 75, comment: 'ok', suggestions: [] },
        specificity: { score: 80, comment: 'ok', suggestions: [] },
        structure: { score: 80, comment: 'ok', suggestions: [] },
        tone: { score: 78, comment: 'ok', suggestions: [] },
        completeness: { score: 82, comment: 'ok', suggestions: [] },
      },
    },
    durationMs: 1200,
  },
];

describe('MultiModelScoreIsland — done state', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { results: MOCK_RESULTS, usageRemaining: 7 },
      }),
    });
  });

  it('shows comparison table after successful scoring', async () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText('Model Comparison')).toBeTruthy();
    });
  });

  it('displays overall score for each provider', async () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      // overall scores appear in the table (may appear multiple times across dimension rows)
      expect(screen.getAllByText('82').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('79').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows remaining usage count', async () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => {
      expect(screen.getByText(/7.*remaining/i)).toBeTruthy();
    });
  });

  it('sends correct payload to /api/ai-score/multi', async () => {
    render(<MultiModelScoreIsland {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare models/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ai-score/multi');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body as string) as {
      promptId: string;
      content: string;
      providers: string[];
    };
    expect(body.promptId).toBe('p1');
    expect(body.content).toBe('You are a helpful assistant.');
    expect(body.providers).toContain('openai');
    expect(body.providers).toContain('anthropic');
  });
});
