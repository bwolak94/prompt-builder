import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-overlay-chart">{children}</div>
  ),
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

import { ScoreRadarChartOverlay } from '../ScoreRadarChartOverlay';
import type { AIScores } from '@/types';

const SCORES_A: AIScores = {
  clarity: 80,
  specificity: 70,
  structure: 90,
  tone: 75,
  completeness: 85,
};

const SCORES_B: AIScores = {
  clarity: 60,
  specificity: 65,
  structure: 70,
  tone: 80,
  completeness: 55,
};

describe('ScoreRadarChartOverlay', () => {
  it('renders the overlay radar chart', async () => {
    render(<ScoreRadarChartOverlay scoresA={SCORES_A} scoresB={SCORES_B} />);
    expect(await screen.findByTestId('radar-overlay-chart')).toBeTruthy();
  });

  it('renders without crashing with two score sets', () => {
    const { container } = render(<ScoreRadarChartOverlay scoresA={SCORES_A} scoresB={SCORES_B} />);
    expect(container).toBeTruthy();
  });
});
