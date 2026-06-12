import type { APIRoute } from 'astro';
import { z } from 'zod';
import { chainRepo } from '@/db/repositories/chain.repo';

export const prerender = false;

const UpdateNodeSchema = z.object({
  title: z.string().max(200).optional(),
  content_md: z.string().optional(),
  prompt_id: z.string().uuid().nullable().optional(),
});

async function assertChainOwner(locals: App.Locals, chainId: string) {
  const chain = await chainRepo.findById(locals.supabase, chainId);
  if (!chain) return null;
  if (chain.user_id !== locals.user?.id) return 'forbidden' as const;
  return chain;
}

// PUT /api/chains/[id]/nodes/[nodeId]
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertChainOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = UpdateNodeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }), { status: 422 });
  }

  try {
    const node = await chainRepo.updateNode(locals.supabase, params.nodeId!, parsed.data);
    return new Response(JSON.stringify({ data: node }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};

// DELETE /api/chains/[id]/nodes/[nodeId]
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertChainOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await chainRepo.deleteNode(locals.supabase, params.nodeId!);
    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};
