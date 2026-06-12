import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { notFound, forbidden } from '@/lib/api/response';
import { abTestRepo } from '@/db/repositories/ab-test.repo';
import { abTestService } from '@/lib/services/ab-test.service';
import { RUN_PROVIDER_MODELS } from '@/lib/ai/run-provider.factory';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

export const prerender = false;

const TIMEOUT_MS = 120_000;

const RunSchema = z.object({
  provider: z.enum(['openai', 'anthropic']).default('openai'),
  model: z.string().min(1),
  useByok: z.boolean().default(false),
});

/** POST /api/ab-tests/[id]/run — live run both variants as muxed SSE */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  const parsed = await parseBody(request, RunSchema);
  if (parsed instanceof Response) return parsed;

  const { provider, model, useByok } = parsed;

  // Validate model belongs to provider
  const validModels = RUN_PROVIDER_MODELS[provider as RunProviderName];
  if (!validModels.includes(model)) {
    return new Response(
      JSON.stringify({ error: `Model ${model} not available for provider ${provider}` }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);
      try {
        const gen = abTestService.streamBothVariants(
          auth.supabase,
          test.id,
          auth.user.id,
          provider as RunProviderName,
          model,
          useByok,
          abort.signal,
        );

        for await (const chunk of gen) {
          controller.enqueue(encode(chunk));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Run failed';
        controller.enqueue(
          encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`),
        );
      } finally {
        clearTimeout(timeoutId);
        controller.close();
      }
    },
    cancel() {
      abort.abort();
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
