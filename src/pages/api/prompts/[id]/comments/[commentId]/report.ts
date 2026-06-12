import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound } from '@/lib/api/response';
import { commentRepo } from '@/db/repositories/comment.repo';

export const prerender = false;

const ReportSchema = z.object({
  reason: z.enum(['spam', 'abuse', 'offtopic', 'other']),
});

/** POST /api/prompts/[id]/comments/[commentId]/report */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { commentId } = params;
  if (!commentId) return notFound();

  const parsed = await parseBody(request, ReportSchema);
  if (parsed instanceof Response) return parsed;

  await commentRepo.report(auth.supabase, commentId, auth.user.id, parsed.reason);
  return ok({ reported: true });
};
