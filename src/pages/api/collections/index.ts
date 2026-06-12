/**
 * GET  /api/collections  — list user's collections as nested tree
 * POST /api/collections  — create collection
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok } from '@/lib/api/response';
import { collectionRepo } from '@/db/repositories/collection.repo';
import { buildCollectionTree } from '@/lib/services/collection.service';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const flat = await collectionRepo.findByUser(locals.supabase, auth.user.id);
  return ok(buildCollectionTree(flat));
};

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parent_id: z.uuid().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(10).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, CreateSchema);
  if (parsed instanceof Response) return parsed;

  const collection = await collectionRepo.create(locals.supabase, auth.user.id, parsed);
  return ok(collection, 201);
};
