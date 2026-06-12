import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created, notFound } from '@/lib/api/response';
import { abTestService } from '@/lib/services/ab-test.service';
import { abTestRepo } from '@/db/repositories/ab-test.repo';

export const prerender = false;

const CreateSchema = z.object({
  promptId: z.uuid(),
});

/** POST /api/ab-tests — create a new A/B test (B = clone of A) */
export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, CreateSchema);
  if (parsed instanceof Response) return parsed;

  try {
    const test = await abTestService.createTest(auth.supabase, parsed.promptId, auth.user.id);
    return created(test);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create A/B test';
    if (msg === 'Prompt not found') return notFound('Prompt not found');
    return new Response(JSON.stringify({ error: msg }), {
      status: msg === 'Forbidden' ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** GET /api/ab-tests?promptId=xxx — list tests for a prompt */
export const GET: APIRoute = async ({ url, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const promptId = url.searchParams.get('promptId');
  if (!promptId) return notFound('Missing promptId');

  const tests = await abTestRepo.findByPrompt(auth.supabase, promptId);
  return ok(tests);
};
