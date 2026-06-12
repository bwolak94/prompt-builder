import type { SupabaseClient } from '@/db/supabase.client';

export type WebhookType = 'generic' | 'slack' | 'discord';

export type WebhookEventType =
  | 'prompt.forked'
  | 'prompt.commented'
  | 'prompt.rated'
  | 'prompt.score_ready'
  | 'challenge.won';

export interface Webhook {
  id: string;
  user_id: string;
  type: WebhookType;
  label: string;
  url: string;
  events: WebhookEventType[];
  secret: string | null;
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  attempt: number;
  delivered_at: string;
  error: string | null;
}

export interface CreateWebhookData {
  userId: string;
  type: WebhookType;
  label: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
}

export interface LogDeliveryData {
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  statusCode?: number;
  responseBody?: string;
  attempt: number;
  error?: string;
}

export const webhookRepo = {
  async findByUser(supabase: SupabaseClient, userId: string): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list webhooks: ${error.message}`);
    return (data ?? []).map(mapWebhook);
  },

  async findById(supabase: SupabaseClient, id: string): Promise<Webhook | null> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapWebhook(data);
  },

  async findActiveByUserAndEvent(
    supabase: SupabaseClient,
    userId: string,
    event: WebhookEventType,
  ): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (error) return [];
    return (data ?? []).map(mapWebhook);
  },

  async create(supabase: SupabaseClient, d: CreateWebhookData): Promise<Webhook> {
    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: d.userId,
        type: d.type,
        label: d.label,
        url: d.url,
        events: d.events,
        secret: d.secret ?? null,
        headers: d.headers ?? {},
      })
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to create webhook: ${error?.message}`);
    return mapWebhook(data);
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    patch: Partial<Pick<Webhook, 'label' | 'url' | 'events' | 'secret' | 'headers' | 'is_active'>>,
  ): Promise<Webhook> {
    const { data, error } = await supabase
      .from('webhooks')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to update webhook: ${error?.message}`);
    return mapWebhook(data);
  },

  async delete(supabase: SupabaseClient, id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete webhook: ${error.message}`);
  },

  async logDelivery(supabase: SupabaseClient, d: LogDeliveryData): Promise<void> {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: d.webhookId,
      event_type: d.eventType,
      payload: d.payload,
      status_code: d.statusCode ?? null,
      response_body: d.responseBody ?? null,
      attempt: d.attempt,
      error: d.error ?? null,
    });
  },

  async listDeliveries(
    supabase: SupabaseClient,
    webhookId: string,
    limit = 50,
  ): Promise<WebhookDelivery[]> {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to list deliveries: ${error.message}`);
    return (data ?? []) as WebhookDelivery[];
  },
};

function mapWebhook(row: Record<string, unknown>): Webhook {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as WebhookType,
    label: row.label as string,
    url: row.url as string,
    events: (row.events as string[]) as WebhookEventType[],
    secret: row.secret as string | null,
    headers: (row.headers ?? {}) as Record<string, string>,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
  };
}
