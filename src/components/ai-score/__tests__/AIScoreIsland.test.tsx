import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AIScoreFeedback, ScoreResult } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockStatus = 'idle';
let mockScore: ScoreResult | null = null;
let mockError: string | null = null;
const mockTrigger = vi.fn();
const mockReset = vi.fn();

vi.mock('../hooks/useAIScore', () => ({
  useAIScore: () => ({
    status: mockStatus,
    score: mockScore,
    error: mockError,
    trigger: mockTrigger,
    reset: mockReset,
  }),
}));

vi.mock('../components/ScoreStreamLoader', () => ({
  ScoreStreamLoader: () => <div data-testid="score-loader">Loading…</div>,
}));

vi.mock('../components/ScoreRingProgress', () => ({
  ScoreRingProgress: ({ score, label }: { score: number; label: string }) => (
    <div data-testid="score-ring">
      {label}: {Math.round(score)}
    </div>
  ),
}));

vi.mock('../components/DimensionAccordion', () => ({
  DimensionAccordion: () => <div data-testid="dimension-accordion" />,
}));

vi.mock('../components/ScoreRadarChart', () => ({
  ScoreRadarChart: () => <div data-testid="radar-chart" />,
}));

import { AIScoreIsland } from '../AIScoreIsland';

const MOCK_FEEDBACK: AIScoreFeedback = {
  clarity: { score: 80, comment: '', suggestions: [] },
  specificity: { score: 70, comment: '', suggestions: [] },
  structure: { score: 75, comment: '', suggestions: [] },
  tone: { score: 85, comment: '', suggestions: [] },
  completeness: { score: 90, comment: '', suggestions: [] },
};

const MOCK_SCORE: ScoreResult = {
  overall_score: 80,
  scores: { clarity: 80, specificity: 70, structure: 75, tone: 85, completeness: 90 },
  feedback: MOCK_FEEDBACK,
  model_used: 'gpt-4o-mini',
  provider: 'openai',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockStatus = 'idle';
  mockScore = null;
  mockError = null;
  mockTrigger.mockClear();
  mockReset.mockClear();
});

describe('AIScoreIsland — idle', () => {
  it('shows "Oceń prompt" button in idle state', () => {
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByText('Oceń prompt')).toBeTruthy();
  });

  it('shows provider label', () => {
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByText(/GPT-4o mini/)).toBeTruthy();
  });

  it('calls trigger on button click', () => {
    render(<AIScoreIsland promptId="p1" content="some content" />);
    fireEvent.click(screen.getByText('Oceń prompt'));
    expect(mockTrigger).toHaveBeenCalledWith('p1', 'some content', 'openai');
  });
});

describe('AIScoreIsland — loading', () => {
  it('shows loader when status is loading', () => {
    mockStatus = 'loading';
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByTestId('score-loader')).toBeTruthy();
  });
});

describe('AIScoreIsland — error', () => {
  it('shows error message', () => {
    mockStatus = 'error';
    mockError = 'Scoring failed';
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByText('Scoring failed')).toBeTruthy();
  });

  it('shows retry button', () => {
    mockStatus = 'error';
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByText(/Spróbuj ponownie/)).toBeTruthy();
  });
});

describe('AIScoreIsland — complete', () => {
  it('shows score ring with overall score', () => {
    mockStatus = 'complete';
    mockScore = MOCK_SCORE;
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByTestId('score-ring')).toBeTruthy();
    expect(screen.getByText(/80/)).toBeTruthy();
  });

  it('shows dimension accordion', () => {
    mockStatus = 'complete';
    mockScore = MOCK_SCORE;
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByTestId('dimension-accordion')).toBeTruthy();
  });

  it('shows re-score button', () => {
    mockStatus = 'complete';
    mockScore = MOCK_SCORE;
    render(<AIScoreIsland promptId="p1" content="some content" />);
    expect(screen.getByLabelText('Oceń ponownie')).toBeTruthy();
  });
});
