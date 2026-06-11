import { useState, useCallback } from 'react';
import type {
  Challenge,
  ChallengeSubmission,
  ChallengeProposal,
  LeaderboardEntry,
} from '@/db/repositories/challenge.repo';

interface UseChallengesReturn {
  challenge: Challenge | null;
  submissions: ChallengeSubmission[];
  proposals: ChallengeProposal[];
  leaderboard: LeaderboardEntry[];
  isSubmitting: boolean;
  submitPrompt: (promptId: string) => Promise<void>;
  toggleVote: (submissionId: string) => Promise<void>;
  toggleProposalVote: (proposalId: string) => Promise<void>;
  createProposal: (title: string, description: string) => Promise<void>;
  refreshSubmissions: () => Promise<void>;
}

export function useChallenges(
  initialChallenge: Challenge | null,
  initialSubmissions: ChallengeSubmission[],
  initialProposals: ChallengeProposal[],
  initialLeaderboard: LeaderboardEntry[],
): UseChallengesReturn {
  const [challenge] = useState(initialChallenge);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [proposals, setProposals] = useState(initialProposals);
  const [leaderboard] = useState(initialLeaderboard);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshSubmissions = useCallback(async () => {
    if (!challenge) return;
    const res = await fetch(`/api/challenges/${challenge.id}/submissions`);
    if (res.ok) {
      const { data } = (await res.json()) as { data: ChallengeSubmission[] };
      setSubmissions(data);
    }
  }, [challenge]);

  const submitPrompt = useCallback(async (promptId: string) => {
    if (!challenge) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Submit failed');
      }
      await refreshSubmissions();
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, refreshSubmissions]);

  const toggleVote = useCallback(async (submissionId: string) => {
    if (!challenge) return;
    const res = await fetch(`/api/challenges/${challenge.id}/submissions/${submissionId}/vote`, {
      method: 'POST',
    });
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: { voted: boolean; count: number } };

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, vote_count: data.count, viewer_voted: data.voted }
          : s,
      ),
    );
  }, [challenge]);

  const toggleProposalVote = useCallback(async (proposalId: string) => {
    const res = await fetch(`/api/challenge-proposals/${proposalId}/vote`, {
      method: 'POST',
    });
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: { voted: boolean; count: number } };

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? { ...p, upvotes: data.count, viewer_voted: data.voted }
          : p,
      ),
    );
  }, []);

  const createProposal = useCallback(async (title: string, description: string) => {
    const res = await fetch('/api/challenge-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? 'Failed to create proposal');
    }
    const { data: newProposal } = (await res.json()) as { data: ChallengeProposal };
    setProposals((prev) => [{ ...newProposal, viewer_voted: false }, ...prev]);
  }, []);

  return {
    challenge,
    submissions,
    proposals,
    leaderboard,
    isSubmitting,
    submitPrompt,
    toggleVote,
    toggleProposalVote,
    createProposal,
    refreshSubmissions,
  };
}
