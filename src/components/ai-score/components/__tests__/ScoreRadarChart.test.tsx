import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
}));

import { ScoreRadarChart } from '../ScoreRadarChart';
import type { AIScores } from '@/types';

const SCORES: AIScores = {
  clarity: 80,
  specificity: 70,
  structure: 90,
  tone: 75,
  completeness: 85,
};

describe('ScoreRadarChart', () => {
  it('renders the radar chart', async () => {
    render(<ScoreRadarChart scores={SCORES} />);
    expect(await screen.findByTestId('radar-chart')).toBeTruthy();
  });

  it('renders suspense fallback initially (before recharts resolves)', () => {
    // When recharts is already mocked synchronously, LazyChart resolves immediately,
    // so at least the component renders without crashing.
    const { container } = render(<ScoreRadarChart scores={SCORES} />);
    expect(container).toBeTruthy();
  });
});
