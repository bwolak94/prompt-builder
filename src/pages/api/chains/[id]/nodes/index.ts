import type { APIRoute } from 'astro';
import { z } from 'zod';
import { chainRepo } from '@/db/repositories/chain.repo';

export const prerender = false;

const CreateNodeSchema = z.object({
  title: z.string().max(200).default(''),
  content_md: z.string().default(''),
  prompt_id: z.string().uuid().nullable().optional(),
  order_index: z.number().int().min(0).default(0),
});

const ReorderSchema = z.object({
  ordered_ids: z.array(z.string().uuid()),
});

async function assertChainOwner(locals: App.Locals, chainId: string) {
  const chain = await chainRepo.findById(locals.supabase, chainId);
  if (!chain) return null;
  if (chain.user_id !== locals.user?.id) return 'forbidden' as const;
  return chain;
}

// POST /api/chains/[id]/nodes — add node
export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertChainOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = CreateNodeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }), { status: 422 });
  }

  try {
    const node = await chainRepo.addNode(locals.supabase, params.id!, parsed.data);
    return new Response(JSON.stringify({ data: node }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};

// PUT /api/chains/[id]/nodes — reorder (special payload: { ordered_ids: string[] })
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const owner = await assertChainOwner(locals, params.id!);
  if (!owner) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (owner === 'forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'ordered_ids required' }), { status: 422 });
  }

  try {
    await chainRepo.reorderNodes(locals.supabase, params.id!, parsed.data.ordered_ids);
    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed' }), { status: 500 });
  }
};
