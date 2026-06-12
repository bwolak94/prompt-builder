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

import BuilderPreviewBlocks from '../BuilderPreviewBlocks';

describe('BuilderPreviewBlocks', () => {
  it('renders three block previews', () => {
    render(<BuilderPreviewBlocks />);
    expect(screen.getByText('Rola')).toBeTruthy();
    expect(screen.getByText('Kontekst')).toBeTruthy();
    expect(screen.getByText('Zadanie')).toBeTruthy();
  });

  it('renders block content text', () => {
    render(<BuilderPreviewBlocks />);
    expect(screen.getByText(/senior software engineerem/i)).toBeTruthy();
  });
});
