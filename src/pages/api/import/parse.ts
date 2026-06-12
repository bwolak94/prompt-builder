import type { APIRoute } from 'astro';
import { z } from 'zod';
import { heuristicParse, aiParse } from '@/lib/services/import.service';

export const prerender = false;

const BodySchema = z.object({
  text: z.string().min(1).max(20_000),
  mode: z.enum(['heuristic', 'ai']).default('heuristic'),
});

/**
 * POST /api/import/parse
 *
 * Parses raw pasted prompt text into structured blocks.
 * Two modes:
 *   heuristic — instant regex-based parser, no AI cost
 *   ai        — Claude Haiku call for more accurate parsing
 *
 * Requires authentication.
 * Returns: { data: { title: string, blocks: ImportedBlock[] } }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }),
      { status: 422 },
    );
  }

  try {
    const result =
      parsed.data.mode === 'ai'
        ? await aiParse(parsed.data.text)
        : heuristicParse(parsed.data.text);

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
