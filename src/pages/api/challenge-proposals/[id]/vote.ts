/** POST /api/challenge-proposals/[id]/vote — toggle upvote on proposal */
import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  const result = await challengeRepo.toggleProposalVote(locals.supabase, id, auth.user.id);
  return ok(result);
};
