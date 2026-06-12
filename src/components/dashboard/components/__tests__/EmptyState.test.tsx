import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('shows "no prompts" message when filter is "all"', () => {
    render(<EmptyState filter="all" />);
    expect(screen.getByText('Nie masz jeszcze żadnych promptów')).toBeTruthy();
  });

  it('shows "no prompts in category" message when filter is not "all"', () => {
    render(<EmptyState filter="public" />);
    expect(screen.getByText('Brak promptów w tej kategorii')).toBeTruthy();
  });

  it('shows CTA link to builder when filter is "all"', () => {
    render(<EmptyState filter="all" />);
    const link = screen.getByRole('link', { name: /stwórz pierwszy prompt/i });
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).href).toContain('/builder');
  });

  it('does not show CTA link when filter is not "all"', () => {
    render(<EmptyState filter="private" />);
    expect(screen.queryByRole('link', { name: /stwórz pierwszy prompt/i })).toBeNull();
  });

  it('shows hint to change filter when filtered', () => {
    render(<EmptyState filter="unscored" />);
    expect(screen.getByText('Zmień filtr lub utwórz nowy prompt')).toBeTruthy();
  });
});
