import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { runService } from '@/lib/services/run.service';
import { RUN_PROVIDER_MODELS } from '@/lib/ai/run-provider.factory';

export const prerender = false;

const TIMEOUT_MS = 60_000;

const RunBodySchema = z.object({
  promptText: z.string().min(1).max(50_000),
  provider: z.enum(['openai', 'anthropic']),
  model: z.string().min(1),
  useByok: z.boolean().default(false),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, RunBodySchema);
  if (parsed instanceof Response) return parsed;

  const { promptText, provider, model, useByok } = parsed;

  // Validate model belongs to provider
  const validModels = RUN_PROVIDER_MODELS[provider];
  if (!validModels.includes(model)) {
    return new Response(
      JSON.stringify({ error: `Invalid model "${model}" for provider "${provider}"` }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);

      try {
        const gen = runService.stream(auth.supabase, {
          userId: auth.user.id,
          promptText,
          provider,
          model,
          useByok,
          signal: abortController.signal,
        });

        for await (const event of gen) {
          if (abortController.signal.aborted) break;
          controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        console.error('[run] stream error:', err);
        controller.enqueue(
          encode(`data: ${JSON.stringify({ type: 'error', error: 'Run failed' })}\n\n`),
        );
      } finally {
        clearTimeout(timeoutId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
