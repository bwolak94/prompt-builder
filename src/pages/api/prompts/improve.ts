import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, error } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { autoImproveService } from '@/lib/services/auto-improve.service';

export const prerender = false;

// 20 improve calls per hour per user
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const BodySchema = z.object({
  content: z.string().min(1).max(12_000),
  sectionSlug: z.string().optional(),
  mode: z.enum(['block', 'full']).default('block'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`improve:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return error('Too many improve requests. Try again later.', 429);
  }

  const parsed = await parseBody(request, BodySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const variants =
      parsed.mode === 'full'
        ? await autoImproveService.improveAll(parsed.content)
        : await autoImproveService.improveBlock(parsed.content, parsed.sectionSlug);

    return ok({ variants });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Improve failed';
    return error(message, 500);
  }
};
