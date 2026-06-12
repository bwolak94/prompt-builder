/** DELETE /api/collections/[id]/prompts/[promptId] — remove prompt from collection */
import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { noContent, notFound } from '@/lib/api/response';
import { collectionRepo } from '@/db/repositories/collection.repo';
import { assertOwner } from '@/lib/services/collection.service';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id, promptId } = params;
  if (!id || !promptId) return notFound();

  await assertOwner(locals.supabase, id, auth.user.id);
  await collectionRepo.removePrompt(locals.supabase, id, promptId);
  return noContent();
};
