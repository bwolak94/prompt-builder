/**
 * GET  /api/community/featured  — list featured prompts (public)
 * PUT  /api/community/featured  — toggle featured flag (admin only)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, forbidden } from '@/lib/api/response';
import { communityFeedRepo } from '@/db/repositories/community-feed.repo';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const items = await communityFeedRepo.findFeatured(locals.supabase);
  return ok(items);
};

const SetFeaturedSchema = z.object({
  promptId: z.uuid(),
  featured: z.boolean(),
});

export const PUT: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  // Admin check — only users with plan='admin' can curate featured
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('plan')
    .eq('id', auth.user.id)
    .single();

  if (profile?.plan !== 'admin') return forbidden('Admin access required');

  const parsed = await parseBody(request, SetFeaturedSchema);
  if (parsed instanceof Response) return parsed;

  await communityFeedRepo.setFeatured(locals.supabase, parsed.promptId, parsed.featured);
  return ok({ updated: true });
};
