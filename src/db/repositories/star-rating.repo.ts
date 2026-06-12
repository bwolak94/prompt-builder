import type { SupabaseClient } from '@/db/supabase.client';

export interface StarRating {
  id: string;
  prompt_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface RatingStats {
  avg_rating: number | null;
  rating_count: number;
  user_rating: number | null;
}

export const starRatingRepo = {
  /** Upsert a user's star rating (1–5). Returns the saved rating. */
  async upsert(supabase: SupabaseClient, promptId: string, userId: string, rating: number): Promise<StarRating> {
    const { data, error } = await supabase
      .from('prompt_star_ratings')
      .upsert({ prompt_id: promptId, user_id: userId, rating, updated_at: new Date().toISOString() }, {
        onConflict: 'prompt_id,user_id',
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to save rating: ${error?.message}`);
    return data as StarRating;
  },

  /** Delete the user's rating for a prompt. */
  async deleteOwn(supabase: SupabaseClient, promptId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_star_ratings')
      .delete()
      .eq('prompt_id', promptId)
      .eq('user_id', userId);
    if (error) throw new Error(`Failed to delete rating: ${error.message}`);
  },

  /** Get stats for a prompt and the current user's rating (if any). */
  async getStats(supabase: SupabaseClient, promptId: string, userId?: string): Promise<RatingStats> {
    // Prompt table has denormalised avg_rating/rating_count
    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('avg_rating, rating_count')
      .eq('id', promptId)
      .single();

    if (error || !prompt) return { avg_rating: null, rating_count: 0, user_rating: null };

    let userRating: number | null = null;
    if (userId) {
      const { data } = await supabase
        .from('prompt_star_ratings')
        .select('rating')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .maybeSingle();
      userRating = (data as { rating: number } | null)?.rating ?? null;
    }

    return {
      avg_rating: (prompt as { avg_rating: number | null }).avg_rating,
      rating_count: (prompt as { rating_count: number }).rating_count,
      user_rating: userRating,
    };
  },
};
