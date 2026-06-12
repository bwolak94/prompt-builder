import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound } from '@/lib/api/response';
import { webhookRepo } from '@/db/repositories/webhook.repo';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, url }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Webhook not found');

  const webhook = await webhookRepo.findById(auth.supabase, id);
  if (!webhook || webhook.user_id !== auth.user.id) return notFound('Webhook not found');

  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
  const deliveries = await webhookRepo.listDeliveries(auth.supabase, id, limit);
  return ok(deliveries);
};
