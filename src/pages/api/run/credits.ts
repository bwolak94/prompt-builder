import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok } from '@/lib/api/response';
import { runCreditsRepo } from '@/db/repositories/run-credits.repo';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const status = await runCreditsRepo.getStatus(auth.supabase, auth.user.id);
  return ok(status);
};
