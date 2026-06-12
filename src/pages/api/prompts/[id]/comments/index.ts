import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created, notFound, validationError } from '@/lib/api/response';
import { commentRepo } from '@/db/repositories/comment.repo';

export const prerender = false;

const CreateSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

/** GET /api/prompts/[id]/comments?cursor=xxx — list threaded comments */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const cursor = url.searchParams.get('cursor') ?? undefined;
  const userId = locals.user?.id;

  const result = await commentRepo.listThreaded(locals.supabase, id, cursor, userId);
  return ok(result);
};

/** POST /api/prompts/[id]/comments — add a comment or reply */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  const parsed = await parseBody(request, CreateSchema);
  if (parsed instanceof Response) return parsed;

  // Enforce max depth 2: if parentId is provided, check it has no parent
  if (parsed.parentId) {
    const { data: parent } = await auth.supabase
      .from('prompt_comments')
      .select('parent_id')
      .eq('id', parsed.parentId)
      .single();
    if (parent && (parent as { parent_id: string | null }).parent_id) {
      return validationError('Replies can only be one level deep');
    }
  }

  const comment = await commentRepo.create(
    auth.supabase,
    id,
    auth.user.id,
    parsed.content,
    parsed.parentId,
  );

  return created(comment);
};
