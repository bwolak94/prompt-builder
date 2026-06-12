import type { APIRoute } from 'astro';
import { z } from 'zod';
import { aiScoreService } from '@/lib/services/ai-score.service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { AI_SCORE_RATE_LIMIT, AI_SCORE_RATE_WINDOW_MS } from '@/lib/constants';

export const prerender = false;

const TIMEOUT_MS = 30_000;

const BodySchema = z.object({
  promptId: z.uuid(),
  content: z.string().min(1).max(20_000),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(`ai-score:${user.id}`, AI_SCORE_RATE_LIMIT, AI_SCORE_RATE_WINDOW_MS);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again later.', resetAt: rl.resetAt }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // Parse body
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

  const { promptId, content, provider } = parsed.data;
  const supabase = locals.supabase;

  // AbortController for 30s timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);
      let rawJson = '';

      try {
        const iterable = aiScoreService.getStream(content, provider);

        for await (const delta of iterable) {
          if (abortController.signal.aborted) break;
          rawJson += delta;
          controller.enqueue(encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }

        clearTimeout(timeoutId);

        // Parse and save
        if (rawJson && !abortController.signal.aborted) {
          try {
            await aiScoreService.parseAndSave(supabase, promptId, rawJson, provider);
          } catch (saveErr) {
            // Non-fatal: stream already delivered; just log
            console.error('[ai-score] failed to save rating:', saveErr);
          }
        }

        controller.enqueue(encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        clearTimeout(timeoutId);
        if (abortController.signal.aborted) {
          controller.enqueue(encode(`data: ${JSON.stringify({ error: 'Request timeout' })}\n\n`));
        } else {
          console.error('[ai-score] stream error:', err);
          controller.enqueue(encode(`data: ${JSON.stringify({ error: 'Scoring failed' })}\n\n`));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
