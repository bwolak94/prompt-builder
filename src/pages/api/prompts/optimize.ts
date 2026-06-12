import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, error } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { tokenOptimizerService } from '@/lib/services/token-optimizer.service';

export const prerender = false;

// 20 optimize calls per hour per user
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
  mode: z.enum(['conservative', 'aggressive']).default('conservative'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`optimize:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return error('Too many optimize requests. Try again later.', 429);
  }

  const parsed = await parseBody(request, BodySchema);
  if (parsed instanceof Response) return parsed;

  try {
    const result = await tokenOptimizerService.optimize(parsed.content, parsed.mode);
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Optimization failed';
    return error(message, 500);
  }
};
