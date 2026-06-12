import type { SupabaseClient } from '@/db/supabase.client';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

export interface UserApiKey {
  id: string;
  provider: RunProviderName;
  keyHint: string;
  label: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export const userApiKeysRepo = {
  /** List all API keys for a user (encrypted values are NOT returned). */
  async findByUser(supabase: SupabaseClient, userId: string): Promise<UserApiKey[]> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, key_hint, label, is_active, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to list API keys: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      provider: row.provider as RunProviderName,
      keyHint: row.key_hint,
      label: row.label,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    }));
  },

  /** Get encrypted key for a specific provider (server-side only). */
  async getEncryptedKey(
    supabase: SupabaseClient,
    userId: string,
    provider: RunProviderName,
  ): Promise<string | null> {
    const { data } = await supabase
      .from('user_api_keys')
      .select('key_encrypted')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    return data?.key_encrypted ?? null;
  },

  /** Upsert a key (one active key per provider per user). */
  async upsert(
    supabase: SupabaseClient,
    userId: string,
    provider: RunProviderName,
    keyEncrypted: string,
    keyHint: string,
    label: string,
  ): Promise<UserApiKey> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .upsert(
        {
          user_id: userId,
          provider,
          key_encrypted: keyEncrypted,
          key_hint: keyHint,
          label,
          is_active: true,
        },
        { onConflict: 'user_id,provider' },
      )
      .select('id, provider, key_hint, label, is_active, last_used_at, created_at')
      .single();

    if (error || !data) throw new Error(`Failed to save API key: ${error?.message}`);

    return {
      id: data.id,
      provider: data.provider as RunProviderName,
      keyHint: data.key_hint,
      label: data.label,
      isActive: data.is_active,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
    };
  },

  /** Delete a key by ID (ownership verified via RLS). */
  async deleteById(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('user_api_keys').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete API key: ${error.message}`);
  },

  /** Touch last_used_at timestamp. */
  async touchLastUsed(supabase: SupabaseClient, userId: string, provider: RunProviderName): Promise<void> {
    await supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', provider);
  },
};
