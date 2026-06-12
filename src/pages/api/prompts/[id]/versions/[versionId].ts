import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound, forbidden } from '@/lib/api/response';
import { versionRepo } from '@/db/repositories/version.repo';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { computeDiff } from '@/lib/diff';

export const prerender = false;

/** GET /api/prompts/[id]/versions/[versionId]?diff=true */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id, versionId } = params;
  if (!id || !versionId) return notFound();

  // Verify prompt ownership
  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== auth.user.id) return forbidden();

  const version = await versionRepo.findById(auth.supabase, versionId);
  if (!version || version.prompt_id !== id) return notFound('Version not found');

  const withDiff = url.searchParams.get('diff') === 'true';

  if (!withDiff) {
    return ok(version);
  }

  // Compute diff against previous version
  const prev = await versionRepo.findPrevious(auth.supabase, id, version.version_number);
  const diff = prev ? computeDiff(prev.content_md, version.content_md) : computeDiff('', version.content_md);

  return ok({ ...version, diff, prevVersionNumber: prev?.version_number ?? null });
};
