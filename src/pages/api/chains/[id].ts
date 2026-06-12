import type { APIRoute } from 'astro';
import { z } from 'zod';
import { chainRepo } from '@/db/repositories/chain.repo';

export const prerender = false;

const UpdateChainSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().optional(),
});

async function assertOwner(locals: App.Locals, id: string) {
  const chain = await chainRepo.findById(locals.supabase, id);
  if (!chain) return null;
  if (chain.user_id !== locals.user?.id) return 'forbidden';
  return chain;
}

// GET /api/chains/[id]
export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const chain = await chainRepo.findById(locals.supabase, params.id!);
  if (!chain) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (chain.user_id !== locals.user.id && !chain.is_public) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  return new Response(JSON.stringify({ data: chain }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT /api/chains/[id]
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = UpdateChainSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }), { status: 422 });
  }

  try {
    const updated = await chainRepo.update(locals.supabase, params.id!, {
      ...parsed.data,
      description: parsed.data.description ?? undefined,
    });
    return new Response(JSON.stringify({ data: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};

// DELETE /api/chains/[id]
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await chainRepo.delete(locals.supabase, params.id!);
    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};
