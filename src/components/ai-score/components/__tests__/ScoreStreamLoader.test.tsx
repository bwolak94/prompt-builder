import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreStreamLoader } from '../ScoreStreamLoader';

describe('ScoreStreamLoader', () => {
  it('has role="status" with aria-busy="true"', () => {
    render(<ScoreStreamLoader />);
    const status = screen.getByRole('status');
    expect((status as HTMLElement).getAttribute('aria-busy')).toBe('true');
  });

  it('has an accessible loading label', () => {
    render(<ScoreStreamLoader />);
    expect(screen.getByRole('status', { name: /Trwa ocenianie/i })).toBeTruthy();
  });

  it('renders 5 dimension skeleton rows', () => {
    const { container } = render(<ScoreStreamLoader />);
    // 5 dimension rows are flex containers inside the main div
    const rows = container.querySelectorAll('.flex.items-center.gap-3');
    expect(rows.length).toBe(5);
  });
});
