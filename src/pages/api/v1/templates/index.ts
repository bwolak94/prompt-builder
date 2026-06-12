import type { APIRoute } from 'astro';
import { ok, error } from '@/lib/api/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // Templates are public — no auth required
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const cursor = url.searchParams.get('cursor');
  const category = url.searchParams.get('category');
  const difficulty = url.searchParams.get('difficulty');
  const search = url.searchParams.get('search');

  let query = locals.supabase
    .from('system_templates')
    .select('id, title, description, category, difficulty, tags, content_md, fork_count, created_at')
    .order('id', { ascending: true })
    .limit(limit + 1);

  if (cursor) query = query.gt('id', cursor);
  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error: qErr } = await query;
  if (qErr) return error('Failed to fetch templates', 500);

  const hasMore = (data?.length ?? 0) > limit;
  const items = hasMore ? data!.slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return ok({ data: items, nextCursor });
};
