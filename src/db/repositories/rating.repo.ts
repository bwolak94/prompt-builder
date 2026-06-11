import type { SupabaseClient } from '@/db/supabase.client';
import type { AIScores, AIScoreFeedback } from '@/types';
import type { Json } from '@/db/types';

export interface PromptRatingRow {
  id: string;
  prompt_id: string;
  overall_score: number;
  scores: AIScores;
  feedback: AIScoreFeedback;
  model_used: string;
  provider: string;
  created_at: string;
}

interface CreateRatingInput {
  promptId: string;
  overallScore: number;
  scores: AIScores;
  feedback: AIScoreFeedback;
  modelUsed: string;
  provider: string;
}

export const ratingRepo = {
  async create(supabase: SupabaseClient, input: CreateRatingInput): Promise<PromptRatingRow> {
    const { data, error } = await supabase
      .from('prompt_ratings')
      .insert({
        prompt_id: input.promptId,
        overall_score: input.overallScore,
        scores: input.scores as unknown as Json,
        feedback: input.feedback as unknown as Json,
        model_used: input.modelUsed,
        provider: input.provider,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to save rating');

    return {
      id: data.id,
      prompt_id: data.prompt_id,
      overall_score: data.overall_score,
      scores: data.scores as unknown as AIScores,
      feedback: data.feedback as unknown as AIScoreFeedback,
      model_used: data.model_used,
      provider: data.provider,
      created_at: data.created_at,
    };
  },

  async findLatestByPromptId(supabase: SupabaseClient, promptId: string): Promise<PromptRatingRow | null> {
    const { data, error } = await supabase
      .from('prompt_ratings')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      prompt_id: data.prompt_id,
      overall_score: data.overall_score,
      scores: data.scores as unknown as AIScores,
      feedback: data.feedback as unknown as AIScoreFeedback,
      model_used: data.model_used,
      provider: data.provider,
      created_at: data.created_at,
    };
  },
};
