/**
 * GET /api/community/feed
 * Public endpoint — no auth required.
 * Query params: tab, category, period, cursor, limit
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { parseQuery } from '@/lib/api/validate';
import { ok } from '@/lib/api/response';
import { communityFeedRepo } from '@/db/repositories/community-feed.repo';

export const prerender = false;

const QuerySchema = z.object({
  tab: z.enum(['trending', 'recent', 'top_rated', 'featured']).default('trending'),
  category: z.string().optional(),
  period: z.enum(['24h', 'week', 'month', 'all']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const GET: APIRoute = async ({ url, locals }) => {
  const parsed = parseQuery(url, QuerySchema);
  if (parsed instanceof Response) return parsed;

  const page = await communityFeedRepo.findFeed(locals.supabase, parsed);
  return ok(page);
};
