import type { APIRoute } from 'astro';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { autoCategorizeService } from '@/lib/services/auto-categorize.service';

export const prerender = false;

/**
 * POST /api/prompts/[id]/suggest
 *
 * Calls Claude Haiku to suggest category, difficulty and tags for the prompt.
 * Does NOT apply suggestions — the client must PATCH separately after user accepts.
 *
 * Requires: authenticated user who owns the prompt.
 * Returns: { data: { category, difficulty, tags } }
 */
export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  const prompt = await promptRepo.findById(locals.supabase, id);
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  if (prompt.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    const suggestion = await autoCategorizeService.suggest(prompt.content_md);
    return new Response(JSON.stringify({ data: suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI suggestion failed';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
