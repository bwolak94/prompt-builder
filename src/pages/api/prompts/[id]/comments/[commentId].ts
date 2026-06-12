import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { commentRepo } from '@/db/repositories/comment.repo';

export const prerender = false;

const UpdateSchema = z.object({
  content: z.string().min(1).max(2000),
});

/** PUT /api/prompts/[id]/comments/[commentId] — edit own comment */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { commentId } = params;
  if (!commentId) return notFound();

  const parsed = await parseBody(request, UpdateSchema);
  if (parsed instanceof Response) return parsed;

  // RLS enforces ownership on update; we let DB reject if not owner
  try {
    const updated = await commentRepo.update(auth.supabase, commentId, parsed.content);
    return ok(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** DELETE /api/prompts/[id]/comments/[commentId] — soft delete own comment */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { commentId } = params;
  if (!commentId) return notFound();

  await commentRepo.softDelete(auth.supabase, commentId);
  return new Response(null, { status: 204 });
};
