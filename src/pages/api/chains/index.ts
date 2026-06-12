import type { APIRoute } from 'astro';
import { z } from 'zod';
import { chainRepo } from '@/db/repositories/chain.repo';

export const prerender = false;

const CreateChainSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
});

// GET /api/chains — list user's chains
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const chains = await chainRepo.findByUser(locals.supabase, locals.user.id);
  return new Response(JSON.stringify({ data: chains }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/chains — create chain
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = CreateChainSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }), { status: 422 });
  }

  try {
    const chain = await chainRepo.create(locals.supabase, locals.user.id, parsed.data);
    return new Response(JSON.stringify({ data: chain }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};
