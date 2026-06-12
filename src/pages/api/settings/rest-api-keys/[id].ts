import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { noContent, notFound } from '@/lib/api/response';
import { apiKeyRepo } from '@/db/repositories/api-key.repo';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Key not found');

  await apiKeyRepo.deactivate(auth.supabase, id, auth.user.id);
  return noContent();
};
