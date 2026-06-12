/** GET /api/challenges/[id] — challenge detail (public) */
import type { APIRoute } from 'astro';
import { ok, notFound } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const [challenge, submissions] = await Promise.all([
    challengeRepo.findById(locals.supabase, id),
    challengeRepo.getSubmissions(locals.supabase, id, locals.user?.id),
  ]);

  if (!challenge) return notFound();
  return ok({ challenge, submissions });
};
