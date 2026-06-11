import { z } from 'zod';
import type { AIProvider } from '@/types';

// ── Provider interface ─────────────────────────────────────────────────────────

export interface ScoringProvider {
  readonly name: AIProvider;
  score(content: string): AsyncIterable<string>;
}

// ── Zod schema for AI response ────────────────────────────────────────────────

const DimensionSchema = z.object({
  score: z.number().min(0).max(100),
  comment: z.string(),
  suggestions: z.array(z.string()),
});

export const ScoreResponseSchema = z.object({
  overall: z.number().min(0).max(100),
  dimensions: z.object({
    clarity: DimensionSchema,
    specificity: DimensionSchema,
    structure: DimensionSchema,
    tone: DimensionSchema,
    completeness: DimensionSchema,
  }),
});

export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

// ── Factory ───────────────────────────────────────────────────────────────────

export async function getScoringProvider(provider: AIProvider): Promise<ScoringProvider> {
  if (provider === 'anthropic') {
    const { AnthropicScoringProvider } = await import('./providers/anthropic.provider');
    return new AnthropicScoringProvider();
  }
  const { OpenAIScoringProvider } = await import('./providers/openai.provider');
  return new OpenAIScoringProvider();
}
