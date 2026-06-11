import type { APIRoute } from 'astro';
import { z } from 'zod';
import { templateRepo } from '@/db/repositories/template.repo';

export const prerender = false;

const QuerySchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  cursor: z.string().optional(),
});

export const GET: APIRoute = async ({ locals, url }) => {
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Invalid parameters' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const result = await templateRepo.findMany(locals.supabase, parsed.data);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
