import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created, notFound, forbidden } from '@/lib/api/response';
import { versionRepo } from '@/db/repositories/version.repo';
import { versionService } from '@/lib/services/version.service';
import { promptRepo } from '@/db/repositories/prompt.repo';

export const prerender = false;

const CreateVersionSchema = z.object({
  summary: z.string().max(200).optional(),
});

/** GET /api/prompts/[id]/versions — list version summaries (newest first) */
export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Missing prompt id');

  // verify ownership via RLS (RLS on prompt_versions checks prompts.user_id)
  const versions = await versionRepo.findByPrompt(auth.supabase, id);
  return ok(versions);
};

/** POST /api/prompts/[id]/versions — create a snapshot of the current prompt */
export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Missing prompt id');

  const parsed = await parseBody(request, CreateVersionSchema);
  if (parsed instanceof Response) return parsed;

  // Load the current prompt state
  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== auth.user.id) return forbidden();

  try {
    const version = await versionService.createVersion(
      auth.supabase,
      auth.user.id,
      prompt,
      parsed.summary,
    );
    return created(version);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create version';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
