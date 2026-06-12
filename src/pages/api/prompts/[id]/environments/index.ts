import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound } from '@/lib/api/response';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { environmentService } from '@/lib/services/environment.service';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Prompt not found');

  const prompt = await promptRepo.findById(auth.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== auth.user.id) return notFound('Prompt not found');

  const [environments, promotions] = await Promise.all([
    environmentService.getAll(auth.supabase, id),
    environmentService.listPromotions(auth.supabase, id),
  ]);

  return ok({ environments, promotions });
};
