import { getScoringProvider, ScoreResponseSchema } from '@/lib/ai/scoring.provider';
import { ratingRepo, type PromptRatingRow } from '@/db/repositories/rating.repo';
import type { SupabaseClient } from '@/db/supabase.client';
import type { AIProvider } from '@/types';

export const aiScoreService = {
  getStream(content: string, provider: AIProvider): AsyncIterable<string> {
    // Returns iterable immediately; provider is resolved lazily
    return {
      async *[Symbol.asyncIterator]() {
        const p = await getScoringProvider(provider);
        yield* p.score(content);
      },
    };
  },

  async parseAndSave(
    supabase: SupabaseClient,
    promptId: string,
    rawJson: string,
    provider: AIProvider,
  ): Promise<PromptRatingRow> {
    const parsed = ScoreResponseSchema.parse(JSON.parse(rawJson));

    const modelUsed = provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001';

    const scores = {
      clarity: parsed.dimensions.clarity.score,
      specificity: parsed.dimensions.specificity.score,
      structure: parsed.dimensions.structure.score,
      tone: parsed.dimensions.tone.score,
      completeness: parsed.dimensions.completeness.score,
    };

    return ratingRepo.create(supabase, {
      promptId,
      overallScore: parsed.overall,
      scores,
      feedback: parsed.dimensions,
      modelUsed,
      provider,
    });
  },
};
