/**
 * POST   /api/challenges/[id]/submissions/[sid]/vote — toggle vote
 * DELETE /api/challenges/[id]/submissions/[sid]/vote — remove vote
 */
import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { sid } = params;
  if (!sid) return notFound();

  const result = await challengeRepo.toggleVote(locals.supabase, sid, auth.user.id);
  return ok(result);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { sid } = params;
  if (!sid) return notFound();

  // Force remove vote
  await locals.supabase
    .from('challenge_votes')
    .delete()
    .eq('submission_id', sid)
    .eq('user_id', auth.user.id);

  return ok({ voted: false });
};
