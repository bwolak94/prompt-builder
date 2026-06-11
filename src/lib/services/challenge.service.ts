import type { SupabaseClient } from '@/db/supabase.client';
import { challengeRepo } from '@/db/repositories/challenge.repo';
import type { Challenge } from '@/db/repositories/challenge.repo';

export const challengeService = {
  /**
   * Create a new challenge from a proposal (admin action).
   * Sets starts_at to today, ends_at to +7 days, voting_ends_at to +9 days.
   */
  async createFromProposal(
    supabase: SupabaseClient,
    proposalId: string,
    overrides?: Partial<Pick<Challenge, 'starts_at' | 'ends_at' | 'voting_ends_at' | 'category'>>,
  ): Promise<Challenge> {
    const { data: proposal, error } = await supabase
      .from('challenge_proposals')
      .select('title, description')
      .eq('id', proposalId)
      .single();

    if (error || !proposal) throw new Error('Proposal not found');

    const now = new Date();
    const starts_at = overrides?.starts_at ?? now.toISOString();
    const ends_at = overrides?.ends_at ?? new Date(now.getTime() + 7 * 86400000).toISOString();
    const voting_ends_at = overrides?.voting_ends_at ?? new Date(now.getTime() + 9 * 86400000).toISOString();

    const challenge = await challengeRepo.create(supabase, {
      proposal_id: proposalId,
      title: (proposal as { title: string }).title,
      description: (proposal as { description: string }).description,
      category: overrides?.category,
      starts_at,
      ends_at,
      voting_ends_at,
    });

    await challengeRepo.approveProposal(supabase, proposalId);
    return challenge;
  },

  /**
   * Create a challenge directly (admin, without a proposal).
   */
  async createDirect(
    supabase: SupabaseClient,
    dto: {
      title: string;
      description: string;
      category?: string;
      starts_at: string;
      ends_at: string;
      voting_ends_at: string;
    },
  ): Promise<Challenge> {
    return challengeRepo.create(supabase, dto);
  },

  /**
   * Submit a prompt to a challenge. Validates the challenge is active.
   */
  async submitPrompt(
    supabase: SupabaseClient,
    challengeId: string,
    userId: string,
    promptId: string,
  ): Promise<void> {
    const challenge = await challengeRepo.findById(supabase, challengeId);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.status !== 'active') {
      throw new Error('Challenge is not accepting submissions');
    }

    // Verify the prompt belongs to the user and is public
    const { data: prompt } = await supabase
      .from('prompts')
      .select('user_id, is_public')
      .eq('id', promptId)
      .single();

    if (!prompt || (prompt as { user_id: string }).user_id !== userId) {
      throw new Error('Prompt not found or not owned by user');
    }
    if (!(prompt as { is_public: boolean }).is_public) {
      throw new Error('Prompt must be public to submit to a challenge');
    }

    await challengeRepo.submit(supabase, challengeId, userId, promptId);
  },
};
