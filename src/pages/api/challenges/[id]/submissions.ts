/** GET /api/challenges/[id]/submissions — list submissions with vote state */
import type { APIRoute } from 'astro';
import { ok, notFound } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound();

  const submissions = await challengeRepo.getSubmissions(locals.supabase, id, locals.user?.id);
  return ok(submissions);
};
