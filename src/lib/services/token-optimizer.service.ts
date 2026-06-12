import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ── Model pricing ──────────────────────────────────────────────────────────────

export interface ModelPricing {
  model: string;
  label: string;
  /** USD per 1M input tokens */
  inputCostPerMillion: number;
}

export const MODEL_PRICING: readonly ModelPricing[] = [
  { model: 'gpt-4o',                   label: 'GPT-4o',           inputCostPerMillion: 5.00 },
  { model: 'gpt-4o-mini',              label: 'GPT-4o Mini',      inputCostPerMillion: 0.15 },
  { model: 'claude-sonnet-4-6',         label: 'Claude Sonnet',    inputCostPerMillion: 3.00 },
  { model: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',     inputCostPerMillion: 0.25 },
] as const;

// ── Token counting ─────────────────────────────────────────────────────────────

/**
 * Approximate token count — 1 token ≈ 4 characters (typical for English).
 * Fast, client-safe alternative to tiktoken.
 */
export function countTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Estimated cost in USD for 1000 API calls at the given token count.
 */
export function costPer1kCalls(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion * 1000;
}

// ── Optimization modes ─────────────────────────────────────────────────────────

export type OptimizeMode = 'conservative' | 'aggressive';

const OptimizeResponseSchema = z.object({
  optimized: z.string().min(1),
  explanation: z.string(),
});

export interface OptimizeResult {
  optimized: string;
  originalTokens: number;
  optimizedTokens: number;
  savedPercent: number;
  explanation: string;
}

const SYSTEM_PROMPTS: Record<OptimizeMode, string> = {
  conservative: `You are an expert prompt engineer specializing in token efficiency.
Mode: CONSERVATIVE — reduce token count by approximately 20% while preserving ALL meaning, structure, and instructions.
Allowed changes: remove filler words, redundant phrases, excessive whitespace, unnecessary repetition.
NOT allowed: remove key instructions, change meaning, reorder sections significantly.
Keep the same language as the input (do NOT translate).
Return ONLY valid JSON — no markdown: {"optimized":"<optimized text>","explanation":"<1-2 sentences>"}`,

  aggressive: `You are an expert prompt engineer specializing in token efficiency.
Mode: AGGRESSIVE — reduce token count by approximately 40%, it is acceptable to rephrase and trim.
Allowed changes: anything that preserves the core intent: remove examples, shorten phrases, use abbreviations, eliminate redundancy.
Keep the same language as the input (do NOT translate).
Return ONLY valid JSON — no markdown: {"optimized":"<optimized text>","explanation":"<1-2 sentences>"}`,
};

// ── Service ────────────────────────────────────────────────────────────────────

export const tokenOptimizerService = {
  async optimize(content: string, mode: OptimizeMode): Promise<OptimizeResult> {
    const anthropic = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS[mode],
      messages: [{ role: 'user', content: `Optimize this prompt:\n\n${content.slice(0, 12_000)}` }],
    });

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const parsed = OptimizeResponseSchema.parse(JSON.parse(raw));

    const originalTokens = countTokens(content);
    const optimizedTokens = countTokens(parsed.optimized);
    const savedPercent = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);

    return {
      optimized: parsed.optimized,
      originalTokens,
      optimizedTokens,
      savedPercent: Math.max(0, savedPercent),
      explanation: parsed.explanation,
    };
  },
};
