import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { versionService } from '@/lib/services/version.service';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { versionRepo } from '@/db/repositories/version.repo';

export const prerender = false;

/** POST /api/prompts/[id]/versions/[versionId]/restore */
export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id, versionId } = params;
  if (!id || !versionId) return notFound();

  // Verify prompt ownership
  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== auth.user.id) return forbidden();

  // Verify version belongs to this prompt
  const version = await versionRepo.findById(auth.supabase, versionId);
  if (!version || version.prompt_id !== id) return notFound('Version not found');

  try {
    const updated = await versionService.restoreVersion(
      auth.supabase,
      id,
      versionId,
      auth.user.id,
    );
    return ok(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to restore version';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
