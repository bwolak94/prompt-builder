import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound } from '@/lib/api/response';
import { commentRepo } from '@/db/repositories/comment.repo';

export const prerender = false;

/** POST /api/prompts/[id]/comments/[commentId]/helpful — toggle helpful */
export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { commentId } = params;
  if (!commentId) return notFound();

  const result = await commentRepo.toggleHelpful(auth.supabase, commentId, auth.user.id);
  return ok(result);
};
