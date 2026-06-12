/**
 * GET  /api/challenges       — list challenges (public)
 * POST /api/challenges       — create challenge (admin)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, forbidden } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';
import { challengeService } from '@/lib/services/challenge.service';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const challenges = await challengeRepo.list(locals.supabase);
  return ok(challenges);
};

const CreateChallengeSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  category: z.string().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  voting_ends_at: z.string().datetime(),
  proposal_id: z.string().uuid().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { data: profile } = await locals.supabase
    .from('profiles').select('plan').eq('id', auth.user.id).single();
  if (profile?.plan !== 'admin') return forbidden('Admin access required');

  const parsed = await parseBody(request, CreateChallengeSchema);
  if (parsed instanceof Response) return parsed;

  const challenge = parsed.proposal_id
    ? await challengeService.createFromProposal(locals.supabase, parsed.proposal_id, parsed)
    : await challengeService.createDirect(locals.supabase, parsed);

  return ok(challenge, 201);
};
