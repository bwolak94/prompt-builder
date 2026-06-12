import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { abTestRepo } from '@/db/repositories/ab-test.repo';
import { abTestService } from '@/lib/services/ab-test.service';

export const prerender = false;

const ResolveSchema = z.object({
  winner: z.enum(['a', 'b', 'tie']),
  applyWinner: z.boolean().default(false),
});

/** POST /api/ab-tests/[id]/resolve — set winner, optionally replace prompt with B */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  const parsed = await parseBody(request, ResolveSchema);
  if (parsed instanceof Response) return parsed;

  try {
    const result = await abTestService.resolveTest(
      auth.supabase,
      test.id,
      auth.user.id,
      parsed.winner,
      parsed.applyWinner,
    );
    return ok(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve test';
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === 'Forbidden' ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
