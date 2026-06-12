import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created } from '@/lib/api/response';
import { webhookRepo, type WebhookEventType, type WebhookType } from '@/db/repositories/webhook.repo';

export const prerender = false;

const WEBHOOK_EVENTS = [
  'prompt.forked',
  'prompt.commented',
  'prompt.rated',
  'prompt.score_ready',
  'challenge.won',
] as const;

const CreateWebhookSchema = z.object({
  type: z.enum(['generic', 'slack', 'discord'] as const),
  label: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const webhooks = await webhookRepo.findByUser(auth.supabase, auth.user.id);
  return ok(webhooks);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, CreateWebhookSchema);
  if (parsed instanceof Response) return parsed;

  const webhook = await webhookRepo.create(auth.supabase, {
    userId: auth.user.id,
    type: parsed.type as WebhookType,
    label: parsed.label,
    url: parsed.url,
    events: parsed.events as WebhookEventType[],
    secret: parsed.secret,
    headers: parsed.headers,
  });
  return created(webhook);
};
