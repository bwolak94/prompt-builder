import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mock hook (path relative to test file, one level up) ─────────────────────

const mockRate = vi.fn().mockResolvedValue(undefined);
const mockRemoveRating = vi.fn().mockResolvedValue(undefined);

vi.mock('../hooks/useStarRating', () => ({
  useStarRating: (
    _promptId: string,
    initial: { avg_rating: number | null; rating_count: number; user_rating: number | null },
  ) => ({
    stats: { ...initial },
    submitting: false,
    rate: mockRate,
    removeRating: mockRemoveRating,
  }),
}));

import { RatingWidget } from '../RatingWidget';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RatingWidget', () => {
  it('shows "—" when avg_rating is null', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={null}
        initialCount={0}
        initialUserRating={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows average rating when provided', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={4.2}
        initialCount={5}
        initialUserRating={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText('4.2')).toBeTruthy();
  });

  it('shows rating count', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={3.5}
        initialCount={12}
        initialUserRating={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  it('shows login link for non-logged-in users', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={null}
        initialCount={0}
        initialUserRating={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByRole('link', { name: /Zaloguj się/i })).toBeTruthy();
  });

  it('shows interactive star buttons for logged-in users', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={null}
        initialCount={0}
        initialUserRating={null}
        isLoggedIn={true}
      />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
  });

  it('calls rate with correct value when star is clicked', async () => {
    mockRate.mockClear();
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={null}
        initialCount={0}
        initialUserRating={null}
        isLoggedIn={true}
      />,
    );
    fireEvent.click(screen.getByLabelText('4 gwiazdek'));
    await waitFor(() => {
      expect(mockRate).toHaveBeenCalledWith(4);
    });
  });

  it('shows "Oceń ten prompt:" prompt for logged-in users without rating', () => {
    render(
      <RatingWidget
        promptId="p1"
        initialAvg={null}
        initialCount={0}
        initialUserRating={null}
        isLoggedIn={true}
      />,
    );
    expect(screen.getByText('Oceń ten prompt:')).toBeTruthy();
  });
});
