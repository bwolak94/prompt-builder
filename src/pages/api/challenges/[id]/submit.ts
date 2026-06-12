/** POST /api/challenges/[id]/submit — submit a prompt to a challenge */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, error } from '@/lib/api/response';
import { challengeService } from '@/lib/services/challenge.service';

export const prerender = false;

const SubmitSchema = z.object({
  promptId: z.uuid(),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  const parsed = await parseBody(request, SubmitSchema);
  if (parsed instanceof Response) return parsed;

  try {
    await challengeService.submitPrompt(locals.supabase, id, auth.user.id, parsed.promptId);
    return ok({ submitted: true });
  } catch (err) {
    return error(err instanceof Error ? err.message : 'Submit failed', 400);
  }
};
