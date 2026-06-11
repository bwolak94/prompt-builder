import type { SupabaseClient } from '@/db/supabase.client';
import type { Badge, UserBadge } from '@/db/repositories/challenge.repo';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const badgeService = {
  /** Award all badges for a completed challenge (wraps DB function). */
  async awardChallengebadges(supabase: SupabaseClient, challengeId: string): Promise<void> {
    const { error } = await supabase.rpc('award_challenge_badges', {
      p_challenge_id: challengeId,
    });
    if (error) throw new Error(`Failed to award badges: ${error.message}`);
  },

  /** Get all badges earned by a user. */
  async getUserBadges(supabase: SupabaseClient, userId: string): Promise<UserBadge[]> {
    return challengeRepo.getUserBadges(supabase, userId);
  },

  /** List all available badge types. */
  async listBadges(supabase: SupabaseClient): Promise<Badge[]> {
    const { data } = await supabase.from('badges').select('*').order('created_at');
    return (data as Badge[] | null) ?? [];
  },
};
