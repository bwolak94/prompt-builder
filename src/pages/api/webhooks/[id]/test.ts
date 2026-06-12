import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/api/auth';
import { ok, notFound, error } from '@/lib/api/response';
import { webhookRepo } from '@/db/repositories/webhook.repo';
import { WebhookDispatcher } from '@/lib/webhooks/dispatcher';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Webhook not found');

  const webhook = await webhookRepo.findById(auth.supabase, id);
  if (!webhook || webhook.user_id !== auth.user.id) return notFound('Webhook not found');

  const dispatcher = new WebhookDispatcher(auth.supabase);
  dispatcher.dispatch(auth.user.id, 'prompt.forked', {
    prompt_id: 'test-id',
    prompt_title: 'Test Prompt',
    forked_by: { id: auth.user.id, display_name: 'Test User' },
  });

  return ok({ message: 'Test event dispatched' });
};
