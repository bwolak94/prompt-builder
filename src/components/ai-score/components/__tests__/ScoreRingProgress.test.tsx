import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreRingProgress } from '../ScoreRingProgress';

describe('ScoreRingProgress', () => {
  it('renders the score value', () => {
    render(<ScoreRingProgress score={82} />);
    expect(screen.getByText('82')).toBeTruthy();
  });

  it('rounds fractional scores', () => {
    render(<ScoreRingProgress score={78.6} />);
    expect(screen.getByText('79')).toBeTruthy();
  });

  it('renders optional label', () => {
    render(<ScoreRingProgress score={70} label="Overall" />);
    expect(screen.getByText('Overall')).toBeTruthy();
  });

  it('does not render label when omitted', () => {
    render(<ScoreRingProgress score={70} />);
    expect(screen.queryByText('Overall')).toBeNull();
  });

  it('has aria-label with score value', () => {
    render(<ScoreRingProgress score={55} />);
    expect(screen.getByLabelText(/Wynik: 55/i)).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(<ScoreRingProgress score={60} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
