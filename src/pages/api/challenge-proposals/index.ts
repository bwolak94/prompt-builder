/**
 * GET  /api/challenge-proposals — list pending proposals (public)
 * POST /api/challenge-proposals — create proposal (auth)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok } from '@/lib/api/response';
import { challengeRepo } from '@/db/repositories/challenge.repo';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const proposals = await challengeRepo.listProposals(locals.supabase, locals.user?.id);
  return ok(proposals);
};

const ProposalSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(1000),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, ProposalSchema);
  if (parsed instanceof Response) return parsed;

  const proposal = await challengeRepo.createProposal(
    locals.supabase,
    auth.user.id,
    parsed.title,
    parsed.description,
  );
  return ok(proposal, 201);
};
