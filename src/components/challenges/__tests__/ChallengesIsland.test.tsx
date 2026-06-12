import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useChallenges', () => ({
  useChallenges: (
    initialChallenge: unknown,
    initialSubmissions: unknown[],
    initialProposals: unknown[],
    initialLeaderboard: unknown[],
  ) => ({
    challenge: initialChallenge,
    submissions: initialSubmissions,
    proposals: initialProposals,
    leaderboard: initialLeaderboard,
    isSubmitting: false,
    submitPrompt: vi.fn(),
    toggleVote: vi.fn(),
    toggleProposalVote: vi.fn(),
    createProposal: vi.fn(),
  }),
}));

import { ChallengesIsland } from '../ChallengesIsland';

const defaultProps = {
  lang: 'en' as const,
  initialChallenge: null,
  initialSubmissions: [],
  initialProposals: [],
  initialLeaderboard: [],
  isLoggedIn: false,
  userPrompts: [],
};

describe('ChallengesIsland', () => {
  it('renders challenges title', () => {
    render(<ChallengesIsland {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Challenges' })).toBeTruthy();
  });

  it('renders Polish title when lang=pl', () => {
    render(<ChallengesIsland {...defaultProps} lang="pl" />);
    expect(screen.getByRole('heading', { name: 'Wyzwania' })).toBeTruthy();
  });

  it('renders leaderboard section heading', () => {
    render(<ChallengesIsland {...defaultProps} />);
    // There may be multiple "Leaderboard" elements; find at least one heading
    const headings = screen.getAllByText(/Leaderboard/i);
    expect(headings.length).toBeGreaterThan(0);
  });
});
