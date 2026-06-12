/**
 * GET  /api/collections/[id]/prompts  — list prompts in collection
 * POST /api/collections/[id]/prompts  — add prompt to collection
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, error as apiError } from '@/lib/api/response';
import { collectionRepo } from '@/db/repositories/collection.repo';
import { assertOwner } from '@/lib/services/collection.service';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const collection = await collectionRepo.findById(locals.supabase, id);
  if (!collection) return notFound();
  if (!collection.is_public && collection.user_id !== locals.user?.id) return notFound();

  const prompts = await collectionRepo.findPromptsInCollection(locals.supabase, id);
  return ok(prompts);
};

const AddPromptSchema = z.object({
  prompt_id: z.uuid(),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  await assertOwner(locals.supabase, id, auth.user.id);

  const parsed = await parseBody(request, AddPromptSchema);
  if (parsed instanceof Response) return parsed;

  try {
    await collectionRepo.addPrompt(locals.supabase, id, parsed.prompt_id);
    return ok({ added: true }, 201);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to add prompt', 400);
  }
};
