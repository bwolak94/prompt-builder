import type { SupabaseClient } from '@/db/supabase.client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  proposal_id: string | null;
  title: string;
  description: string;
  category: string | null;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  starts_at: string;
  ends_at: string;
  voting_ends_at: string;
  created_at: string;
  /** submission count — optional join */
  submission_count?: number;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  prompt_id: string;
  vote_count: number;
  rank: number | null;
  created_at: string;
  /** joined */
  prompt_title?: string;
  prompt_content_md?: string;
  author_name?: string;
  author_avatar?: string | null;
  viewer_voted?: boolean;
}

export interface ChallengeProposal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  upvotes: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  viewer_voted?: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  wins: number;
  top10s: number;
  total_submissions: number;
  total_votes: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  challenge_id: string | null;
  awarded_at: string;
  badge: Badge;
}

// ── Repository ────────────────────────────────────────────────────────────────

export const challengeRepo = {
  // ── Challenges ─────────────────────────────────────────────────────────────

  async findActive(supabase: SupabaseClient): Promise<Challenge | null> {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .in('status', ['active', 'voting'])
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Challenge | null) ?? null;
  },

  async findById(supabase: SupabaseClient, id: string): Promise<Challenge | null> {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return (data as Challenge | null) ?? null;
  },

  async list(supabase: SupabaseClient, limit = 20): Promise<Challenge[]> {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(limit);
    return (data as Challenge[] | null) ?? [];
  },

  async create(
    supabase: SupabaseClient,
    dto: {
      title: string;
      description: string;
      category?: string;
      starts_at: string;
      ends_at: string;
      voting_ends_at: string;
      proposal_id?: string;
    },
  ): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .insert(dto)
      .select()
      .single();
    if (error || !data) throw new Error(`Failed to create challenge: ${error?.message}`);
    return data as Challenge;
  },

  // ── Submissions ─────────────────────────────────────────────────────────────

  async getSubmissions(
    supabase: SupabaseClient,
    challengeId: string,
    currentUserId?: string,
  ): Promise<ChallengeSubmission[]> {
    const { data, error } = await supabase
      .from('challenge_submissions')
      .select(`
        id, challenge_id, user_id, prompt_id, vote_count, rank, created_at,
        prompts ( title, content_md ),
        profiles ( display_name, avatar_url ),
        challenge_votes ( user_id )
      `)
      .eq('challenge_id', challengeId)
      .order('vote_count', { ascending: false });

    if (error) throw new Error(`Failed to get submissions: ${error.message}`);

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
      const prompt = row.prompts as { title: string; content_md: string } | null;
      const profile = row.profiles as { display_name: string; avatar_url: string | null } | null;
      const votes = row.challenge_votes as Array<{ user_id: string }> | null;
      return {
        id: row.id as string,
        challenge_id: row.challenge_id as string,
        user_id: row.user_id as string,
        prompt_id: row.prompt_id as string,
        vote_count: (row.vote_count as number) ?? 0,
        rank: (row.rank as number | null) ?? null,
        created_at: row.created_at as string,
        prompt_title: prompt?.title,
        prompt_content_md: prompt?.content_md,
        author_name: profile?.display_name,
        author_avatar: profile?.avatar_url ?? null,
        viewer_voted: currentUserId
          ? (votes?.some((v) => v.user_id === currentUserId) ?? false)
          : false,
      };
    });
  },

  async submit(
    supabase: SupabaseClient,
    challengeId: string,
    userId: string,
    promptId: string,
  ): Promise<ChallengeSubmission> {
    const { data, error } = await supabase
      .from('challenge_submissions')
      .insert({ challenge_id: challengeId, user_id: userId, prompt_id: promptId })
      .select()
      .single();
    if (error || !data) throw new Error(`Failed to submit: ${error?.message}`);
    return data as ChallengeSubmission;
  },

  async toggleVote(
    supabase: SupabaseClient,
    submissionId: string,
    userId: string,
  ): Promise<{ voted: boolean; count: number }> {
    const { data: existing } = await supabase
      .from('challenge_votes')
      .select('user_id')
      .eq('submission_id', submissionId)
      .eq('user_id', userId)
      .maybeSingle();

    let voted: boolean;
    if (existing) {
      await supabase
        .from('challenge_votes')
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', userId);
      voted = false;
    } else {
      await supabase
        .from('challenge_votes')
        .insert({ submission_id: submissionId, user_id: userId });
      voted = true;
    }

    const { count } = await supabase
      .from('challenge_votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId);

    const newCount = count ?? 0;
    await supabase
      .from('challenge_submissions')
      .update({ vote_count: newCount })
      .eq('id', submissionId);

    return { voted, count: newCount };
  },

  // ── Proposals ───────────────────────────────────────────────────────────────

  async listProposals(
    supabase: SupabaseClient,
    currentUserId?: string,
  ): Promise<ChallengeProposal[]> {
    const { data, error } = await supabase
      .from('challenge_proposals')
      .select(`
        id, user_id, title, description, upvotes, status, created_at,
        challenge_proposal_votes ( user_id )
      `)
      .eq('status', 'pending')
      .order('upvotes', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to list proposals: ${error.message}`);

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
      const votes = row.challenge_proposal_votes as Array<{ user_id: string }> | null;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        title: row.title as string,
        description: row.description as string,
        upvotes: (row.upvotes as number) ?? 0,
        status: row.status as ChallengeProposal['status'],
        created_at: row.created_at as string,
        viewer_voted: currentUserId
          ? (votes?.some((v) => v.user_id === currentUserId) ?? false)
          : false,
      };
    });
  },

  async createProposal(
    supabase: SupabaseClient,
    userId: string,
    title: string,
    description: string,
  ): Promise<ChallengeProposal> {
    const { data, error } = await supabase
      .from('challenge_proposals')
      .insert({ user_id: userId, title, description })
      .select()
      .single();
    if (error || !data) throw new Error(`Failed to create proposal: ${error?.message}`);
    return data as ChallengeProposal;
  },

  async toggleProposalVote(
    supabase: SupabaseClient,
    proposalId: string,
    userId: string,
  ): Promise<{ voted: boolean; count: number }> {
    const { data: existing } = await supabase
      .from('challenge_proposal_votes')
      .select('user_id')
      .eq('proposal_id', proposalId)
      .eq('user_id', userId)
      .maybeSingle();

    let voted: boolean;
    if (existing) {
      await supabase
        .from('challenge_proposal_votes')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('user_id', userId);
      voted = false;
    } else {
      await supabase
        .from('challenge_proposal_votes')
        .insert({ proposal_id: proposalId, user_id: userId });
      voted = true;
    }

    const { count } = await supabase
      .from('challenge_proposal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId);

    const newCount = count ?? 0;
    await supabase
      .from('challenge_proposals')
      .update({ upvotes: newCount })
      .eq('id', proposalId);

    return { voted, count: newCount };
  },

  async approveProposal(supabase: SupabaseClient, proposalId: string): Promise<void> {
    const { error } = await supabase
      .from('challenge_proposals')
      .update({ status: 'approved' })
      .eq('id', proposalId);
    if (error) throw new Error(`Failed to approve proposal: ${error.message}`);
  },

  // ── Leaderboard & badges ────────────────────────────────────────────────────

  async getLeaderboard(supabase: SupabaseClient, limit = 50): Promise<LeaderboardEntry[]> {
    const { data } = await supabase
      .from('challenge_leaderboard')
      .select('user_id,display_name,avatar_url,wins,top10s,total_submissions,total_votes')
      .limit(limit);
    return (data as LeaderboardEntry[] | null) ?? [];
  },

  async getUserBadges(supabase: SupabaseClient, userId: string): Promise<UserBadge[]> {
    const { data } = await supabase
      .from('user_badges')
      .select('id, user_id, badge_id, challenge_id, awarded_at, badges ( id, slug, name, description, icon )')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      badge_id: row.badge_id as string,
      challenge_id: row.challenge_id as string | null,
      awarded_at: row.awarded_at as string,
      badge: row.badges as Badge,
    }));
  },
};
