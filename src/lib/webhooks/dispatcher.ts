import type { SupabaseClient } from '@/db/supabase.client';
import { webhookRepo, type WebhookEventType, type Webhook } from '@/db/repositories/webhook.repo';
import { sign } from './signer';
import { formatSlackPayload } from './slack-formatter';
import { formatDiscordPayload } from './discord-formatter';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class WebhookDispatcher {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Fire-and-forget dispatch to all active webhooks for a user/event.
   * Does not block the caller.
   */
  dispatch(
    userId: string,
    event: WebhookEventType,
    data: Record<string, unknown>,
  ): void {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    webhookRepo
      .findActiveByUserAndEvent(this.supabase, userId, event)
      .then((webhooks) => {
        for (const webhook of webhooks) {
          this.sendWithRetry(webhook, payload, 1).catch((err) => {
            console.error(`Webhook delivery failed for ${webhook.id}:`, err);
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch webhooks:', err);
      });
  }

  private async sendWithRetry(
    webhook: Webhook,
    payload: WebhookPayload,
    attempt: number,
  ): Promise<void> {
    const rawBody = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'PromptBase-Webhooks/1.0',
      'X-PromptBase-Event': payload.event,
      'X-PromptBase-Delivery': crypto.randomUUID(),
      ...webhook.headers,
    };

    if (webhook.type === 'generic' && webhook.secret) {
      headers['X-PromptBase-Signature'] = await sign(rawBody, webhook.secret);
    }

    let body: string;
    if (webhook.type === 'slack') {
      body = JSON.stringify(formatSlackPayload(payload.event, payload.data));
    } else if (webhook.type === 'discord') {
      body = JSON.stringify(formatDiscordPayload(payload.event, payload.data));
    } else {
      body = rawBody;
    }

    let statusCode: number | undefined;
    let responseBody: string | undefined;
    let errorMsg: string | undefined;

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = res.status;
      responseBody = await res.text().catch(() => '');

      await webhookRepo.logDelivery(this.supabase, {
        webhookId: webhook.id,
        eventType: payload.event,
        payload: payload as unknown as Record<string, unknown>,
        statusCode,
        responseBody,
        attempt,
      });

      if (!res.ok && attempt < 3) {
        await sleep(Math.pow(4, attempt - 1) * 1000);
        return this.sendWithRetry(webhook, payload, attempt + 1);
      }
    } catch (err) {
      errorMsg = String(err);
      await webhookRepo.logDelivery(this.supabase, {
        webhookId: webhook.id,
        eventType: payload.event,
        payload: payload as unknown as Record<string, unknown>,
        attempt,
        error: errorMsg,
      });

      if (attempt < 3) {
        await sleep(Math.pow(4, attempt - 1) * 1000);
        return this.sendWithRetry(webhook, payload, attempt + 1);
      }
    }
  }
}
