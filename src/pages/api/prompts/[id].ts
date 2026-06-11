import type { APIRoute } from 'astro';
import { z } from 'zod';
import { promptService } from '@/lib/services/prompt.service';
import { promptRepo } from '@/db/repositories/prompt.repo';

export const prerender = false;

// ── Validation schema ─────────────────────────────────────────────────────────

const PromptBlockSchema = z.object({
  id: z.string(),
  section_slug: z.string(),
  content: z.string(),
  order_index: z.number().int().min(0),
});

const PromptVariableSchema = z.object({
  name: z.string(),
  label: z.string(),
  defaultValue: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'number']),
  options: z.array(z.string()).optional(),
});

const UpdatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  blocks: z.array(PromptBlockSchema).optional(),
  variables: z.array(PromptVariableSchema).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
});

// ── GET /api/prompts/[id] ─────────────────────────────────────────────────────

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  const prompt = await promptRepo.findById(locals.supabase, id);
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const user = locals.user;
  if (!prompt.is_public && prompt.user_id !== user?.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // fire-and-forget view count for public prompts
  if (prompt.is_public) {
    promptRepo.incrementViewCount(locals.supabase, id);
  }

  return new Response(JSON.stringify({ data: prompt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ── PATCH /api/prompts/[id] ───────────────────────────────────────────────────

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = UpdatePromptSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }),
      { status: 422 },
    );
  }

  try {
    const dto = {
      ...parsed.data,
      // Zod schema allows null for description; UpdatePromptDto expects string | undefined
      description: parsed.data.description ?? undefined,
    };
    const prompt = await promptService.updatePrompt(locals.supabase, id, user.id, dto);
    return new Response(JSON.stringify({ data: prompt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      if (err.message === 'Prompt not found') return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: 'Failed to update prompt' }), { status: 500 });
  }
};

// ── DELETE /api/prompts/[id] ──────────────────────────────────────────────────

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  try {
    await promptService.deletePrompt(locals.supabase, id, user.id);
    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Forbidden') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      if (err.message === 'Prompt not found') return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: 'Failed to delete prompt' }), { status: 500 });
  }
};
