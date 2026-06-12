import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, notFound, forbidden, error } from '@/lib/api/response';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { environmentService } from '@/lib/services/environment.service';
import type { PromptEnv } from '@/db/repositories/environment.repo';

export const prerender = false;

const VALID_ENVS: PromptEnv[] = ['dev', 'staging', 'production'];

const PromoteSchema = z.object({
  version_id: z.string().uuid(),
});

export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id, env } = params;
  if (!id || !env || !VALID_ENVS.includes(env as PromptEnv)) {
    return notFound('Environment not found');
  }

  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt || prompt.user_id !== auth.user.id) return notFound('Prompt not found');

  const envData = await environmentService.get(auth.supabase, id, env as PromptEnv);
  return ok(envData);
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id, env } = params;
  if (!id || !env || !['staging', 'production'].includes(env)) {
    return error('Target env must be staging or production', 400);
  }

  const parsed = await parseBody(request, PromoteSchema);
  if (parsed instanceof Response) return parsed;

  // Get user plan
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('plan')
    .eq('id', auth.user.id)
    .single();

  if (profile?.plan !== 'pro') {
    return forbidden('Staging and production environments require Pro plan');
  }

  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt || prompt.user_id !== auth.user.id) return notFound('Prompt not found');

  try {
    const result = await environmentService.promote(
      auth.supabase,
      id,
      env as 'staging' | 'production',
      parsed.version_id,
      auth.user.id,
      profile.plan,
    );
    return ok(result);
  } catch (err) {
    return error(err instanceof Error ? err.message : 'Promote failed', 400);
  }
};
