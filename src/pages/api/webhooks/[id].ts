import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, noContent, notFound } from '@/lib/api/response';
import { webhookRepo, type WebhookEventType } from '@/db/repositories/webhook.repo';

export const prerender = false;

const WEBHOOK_EVENTS = [
  'prompt.forked',
  'prompt.commented',
  'prompt.rated',
  'prompt.score_ready',
  'challenge.won',
] as const;

const UpdateWebhookSchema = z
  .object({
    label: z.string().min(1).max(100).optional(),
    url: z.url().optional(),
    events: z.array(z.enum(WEBHOOK_EVENTS)).optional(),
    is_active: z.boolean().optional(),
    secret: z.string().nullable().optional(),
  })
  .partial();

export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Webhook not found');

  const webhook = await webhookRepo.findById(auth.supabase, id);
  if (!webhook || webhook.user_id !== auth.user.id) return notFound('Webhook not found');

  return ok(webhook);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Webhook not found');

  const parsed = await parseBody(request, UpdateWebhookSchema);
  if (parsed instanceof Response) return parsed;

  const updated = await webhookRepo.update(auth.supabase, id, auth.user.id, {
    ...(parsed.label !== undefined && { label: parsed.label }),
    ...(parsed.url !== undefined && { url: parsed.url }),
    ...(parsed.events !== undefined && { events: parsed.events as WebhookEventType[] }),
    ...(parsed.is_active !== undefined && { is_active: parsed.is_active }),
    ...(parsed.secret !== undefined && { secret: parsed.secret }),
  });
  return ok(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) return notFound('Webhook not found');

  await webhookRepo.delete(auth.supabase, id, auth.user.id);
  return noContent();
};
