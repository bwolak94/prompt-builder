import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

import FeaturesGridSection from '../FeaturesGridSection';

describe('FeaturesGridSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesGridSection />);
    expect(screen.getByRole('heading', { name: /Wszystko czego potrzebujesz/i })).toBeTruthy();
  });

  it('renders all six feature titles', () => {
    render(<FeaturesGridSection />);
    expect(screen.getByText('Wizualny Builder')).toBeTruthy();
    expect(screen.getByText('AI Scoring')).toBeTruthy();
    expect(screen.getByText('Biblioteka szablonów')).toBeTruthy();
    expect(screen.getByText('Zmienne')).toBeTruthy();
    expect(screen.getByText('Udostępnianie')).toBeTruthy();
    expect(screen.getByText('Fork & Dostosuj')).toBeTruthy();
  });

  it('has accessible section label', () => {
    render(<FeaturesGridSection />);
    expect(screen.getByRole('region', { name: /Wszystko czego potrzebujesz/i })).toBeTruthy();
  });
});
