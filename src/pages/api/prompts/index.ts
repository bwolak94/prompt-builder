import type { APIRoute } from 'astro';
import { z } from 'zod';
import { promptService } from '@/lib/services/prompt.service';

export const prerender = false;

// ── Validation schemas ────────────────────────────────────────────────────────

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

const CreatePromptSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  blocks: z.array(PromptBlockSchema),
  variables: z.array(PromptVariableSchema).default([]),
  tags: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  slug: z.string().optional(),
});

const QuerySchema = z.object({
  is_public: z.enum(['true', 'false']).optional(),
  sort: z.enum(['updated_at', 'created_at', 'title']).default('updated_at'),
});

// ── GET /api/prompts ──────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid query parameters' }), { status: 422 });
  }

  const prompts = await promptService.getPromptsByUser(locals.supabase, user.id);

  const { is_public } = parsed.data;
  const filtered = is_public !== undefined
    ? prompts.filter((p) => p.is_public === (is_public === 'true'))
    : prompts;

  return new Response(JSON.stringify({ data: filtered }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ── POST /api/prompts ─────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = CreatePromptSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }),
      { status: 422 },
    );
  }

  try {
    const prompt = await promptService.createPrompt(locals.supabase, user.id, parsed.data);
    return new Response(JSON.stringify({ data: prompt }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create prompt';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
