import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { abTestRepo, type ABVariant } from '@/db/repositories/ab-test.repo';

export const prerender = false;

const UpdateSchema = z.object({
  variant_b: z
    .object({
      blocks: z.array(z.unknown()),
      content_md: z.string(),
    })
    .optional(),
});

/** GET /api/ab-tests/[id] */
export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  return ok(test);
};

/** PUT /api/ab-tests/[id] — update variant B blocks */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  const parsed = await parseBody(request, UpdateSchema);
  if (parsed instanceof Response) return parsed;

  const updated = await abTestRepo.update(auth.supabase, test.id, {
    ...(parsed.variant_b ? { variant_b: parsed.variant_b as ABVariant } : {}),
  });

  return ok(updated);
};

/** DELETE /api/ab-tests/[id] */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const test = await abTestRepo.findById(auth.supabase, params.id ?? '');
  if (!test) return notFound();
  if (test.user_id !== auth.user.id) return forbidden();

  await abTestRepo.deleteById(auth.supabase, test.id);
  return new Response(null, { status: 204 });
};
