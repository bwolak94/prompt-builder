import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, created, error, unauthorized } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { promptService } from '@/lib/services/prompt.service';

export const prerender = false;

const CreatePromptSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  blocks: z.array(z.object({
    id: z.string(),
    section_slug: z.string(),
    content: z.string(),
    order_index: z.number(),
  })),
  variables: z.array(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional().default(false),
});

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.apiUser) return unauthorized();

  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const search = url.searchParams.get('search');
  const isPublicParam = url.searchParams.get('is_public');

  let query = locals.supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .eq('user_id', locals.apiUser.userId)
    .order('updated_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike('title', `%${search}%`);
  if (isPublicParam !== null) query = query.eq('is_public', isPublicParam === 'true');

  const { data, count, error: qErr } = await query;
  if (qErr) return error('Failed to fetch prompts', 500);

  return ok({ data: data ?? [], total: count ?? 0, page, limit });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.apiUser) return unauthorized();

  const parsed = await parseBody(request, CreatePromptSchema);
  if (parsed instanceof Response) return parsed;

  const prompt = await promptService.createPrompt(locals.supabase, locals.apiUser.userId, {
    ...parsed,
    variables: (parsed.variables ?? []) as import('@/types').PromptVariable[],
    tags: parsed.tags ?? [],
    is_public: parsed.is_public ?? false,
  });
  return created(prompt);
};
