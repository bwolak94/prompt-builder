import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion to avoid animation-related issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

import { vi } from 'vitest';
import HowItWorksSection from '../HowItWorksSection';

describe('HowItWorksSection', () => {
  it('renders the section heading', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('heading', { name: /Jak to działa/i })).toBeTruthy();
  });

  it('renders all three step titles', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Wybierz sekcje')).toBeTruthy();
    expect(screen.getByText('Wypełnij treść')).toBeTruthy();
    expect(screen.getByText('Oceń z AI')).toBeTruthy();
  });

  it('renders step numbers 01, 02, 03', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('02')).toBeTruthy();
    expect(screen.getByText('03')).toBeTruthy();
  });

  it('has accessible section label', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('region', { name: /Jak to działa/i })).toBeTruthy();
  });
});
