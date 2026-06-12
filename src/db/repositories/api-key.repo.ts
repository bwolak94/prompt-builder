import type { SupabaseClient } from '@/db/supabase.client';

export interface RestApiKey {
  id: string;
  user_id: string;
  key_prefix: string;
  key_suffix: string;
  label: string;
  rate_limit: number;
  last_used_at: string | null;
  request_count: number;
  is_active: boolean;
  created_at: string;
  /** Daily usage — joined separately, not in DB row */
  usage_today?: number;
}

export interface CreateApiKeyData {
  userId: string;
  keyHash: string;
  keyPrefix: string;
  keySuffix: string;
  label: string;
}

export const apiKeyRepo = {
  async findByUser(supabase: SupabaseClient, userId: string): Promise<RestApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, key_prefix, key_suffix, label, rate_limit, last_used_at, request_count, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list API keys: ${error.message}`);
    return data ?? [];
  },

  async countByUser(supabase: SupabaseClient, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async create(supabase: SupabaseClient, data: CreateApiKeyData): Promise<RestApiKey> {
    const { data: row, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: data.userId,
        key_hash: data.keyHash,
        key_prefix: data.keyPrefix,
        key_suffix: data.keySuffix,
        label: data.label,
      })
      .select('id, user_id, key_prefix, key_suffix, label, rate_limit, last_used_at, request_count, is_active, created_at')
      .single();

    if (error || !row) throw new Error(`Failed to create API key: ${error?.message}`);
    return row;
  },

  async deactivate(supabase: SupabaseClient, keyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to deactivate API key: ${error.message}`);
  },

  async getUsageToday(supabase: SupabaseClient, keyId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('api_key_usage')
      .select('count')
      .eq('key_id', keyId)
      .eq('date', today)
      .single();

    if (error) return 0;
    return (data as { count: number } | null)?.count ?? 0;
  },
};
