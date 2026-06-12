import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, error } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getScoringProvider, ScoreResponseSchema } from '@/lib/ai/scoring.provider';
import type { AIProvider } from '@/types';

export const prerender = false;

// 10 multi-model score calls per 30 days per user
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const BodySchema = z.object({
  promptId: z.string().uuid(),
  content: z.string().min(1).max(20_000),
  providers: z.array(z.enum(['openai', 'anthropic'])).min(1).max(2),
});

export interface ModelScoreResult {
  provider: AIProvider;
  score: z.infer<typeof ScoreResponseSchema>;
}

async function scoreWithProvider(
  content: string,
  provider: AIProvider,
): Promise<ModelScoreResult> {
  const p = await getScoringProvider(provider);
  let rawJson = '';
  for await (const delta of p.score(content)) {
    rawJson += delta;
  }
  const score = ScoreResponseSchema.parse(JSON.parse(rawJson));
  return { provider, score };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`multi-score:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return error('Monthly multi-model scoring limit reached (10/month).', 429, 'MULTI_SCORE_LIMIT');
  }

  const parsed = await parseBody(request, BodySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const results = await Promise.all(
      parsed.providers.map((p) => scoreWithProvider(parsed.content, p)),
    );

    return ok({
      results,
      usageRemaining: rl.remaining - 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Multi-model scoring failed';
    return error(message, 500);
  }
};
