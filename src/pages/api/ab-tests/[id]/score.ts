import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { abTestRepo } from '@/db/repositories/ab-test.repo';
import { abTestService } from '@/lib/services/ab-test.service';

export const prerender = false;

const ScoreSchema = z.object({
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

/** POST /api/ab-tests/[id]/score — score both variants (offline) */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  const parsed = await parseBody(request, ScoreSchema);
  if (parsed instanceof Response) return parsed;

  try {
    const updated = await abTestService.scoreVariants(
      auth.supabase,
      test.id,
      parsed.provider,
    );
    return ok(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scoring failed';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
