/** POST /api/challenge-proposals/[id]/approve — admin: approve proposal */
import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { data: profile } = await locals.supabase
    .from('profiles').select('plan').eq('id', auth.user.id).single();
  if (profile?.plan !== 'admin') return forbidden('Admin access required');

  const { id } = params;
  if (!id) return notFound();

  await challengeRepo.approveProposal(locals.supabase, id);
  return ok({ approved: true });
};
