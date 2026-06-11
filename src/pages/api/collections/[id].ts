/**
 * GET    /api/collections/[id]  — single collection (own or public)
 * PUT    /api/collections/[id]  — update (owner)
 * DELETE /api/collections/[id]  — delete (owner, cascades children)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, noContent } from '@/lib/api/response';
import { collectionRepo } from '@/db/repositories/collection.repo';
import { assertOwner, collectionService } from '@/lib/services/collection.service';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const collection = await collectionRepo.findById(locals.supabase, id);
  if (!collection) return notFound();
  if (!collection.is_public && collection.user_id !== locals.user?.id) return notFound();

  return ok(collection);
};

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(10).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  await assertOwner(locals.supabase, id, auth.user.id);

  const parsed = await parseBody(request, UpdateSchema);
  if (parsed instanceof Response) return parsed;

  // If toggling is_public, use service to handle slug generation
  if (parsed.is_public !== undefined) {
    const updated = await collectionService.togglePublic(locals.supabase, id, auth.user.id);
    // Apply remaining fields
    const { is_public: _, ...rest } = parsed;
    const final = Object.keys(rest).length > 0
      ? await collectionRepo.update(locals.supabase, id, rest)
      : updated;
    return ok(final);
  }

  const updated = await collectionRepo.update(locals.supabase, id, parsed);
  return ok(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  await assertOwner(locals.supabase, id, auth.user.id);
  await collectionRepo.delete(locals.supabase, id);
  return noContent();
};
