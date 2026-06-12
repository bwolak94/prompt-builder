import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound } from '@/lib/api/response';
import { starRatingRepo } from '@/db/repositories/star-rating.repo';
import { promptRepo } from '@/db/repositories/prompt.repo';

export const prerender = false;

const RateSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

/** GET /api/prompts/[id]/ratings — rating stats + user's own rating */
export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const userId = locals.user?.id;
  const stats = await starRatingRepo.getStats(locals.supabase, id, userId);
  return ok(stats);
};

/** POST /api/prompts/[id]/ratings — create or update star rating */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  // Verify prompt exists and is public (or owned)
  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt) return notFound('Prompt not found');

  const parsed = await parseBody(request, RateSchema);
  if (parsed instanceof Response) return parsed;

  const saved = await starRatingRepo.upsert(auth.supabase, id, auth.user.id, parsed.rating);
  return ok(saved);
};

/** DELETE /api/prompts/[id]/ratings — remove own rating */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound();

  await starRatingRepo.deleteOwn(auth.supabase, id, auth.user.id);
  return new Response(null, { status: 204 });
};
