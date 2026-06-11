import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { noContent, notFound } from '@/lib/api/response';
import { userApiKeysRepo } from '@/db/repositories/user-api-keys.repo';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('API key not found');

  // RLS ensures only the owner can delete
  await userApiKeysRepo.deleteById(auth.supabase, id);
  return noContent();
};
