import type { SupabaseClient } from '@/db/supabase.client';
import type { Json } from '@/db/types';
import type { PromptBlock } from '@/types';

export type PromptEnv = 'dev' | 'staging' | 'production';

export interface PromptEnvironment {
  id: string;
  prompt_id: string;
  environment: PromptEnv;
  version_id: string | null;
  version_number: number | null;
  content_md: string | null;
  blocks: PromptBlock[] | null;
  promoted_by: string | null;
  promoted_at: string;
}

export interface EnvironmentPromotion {
  id: string;
  prompt_id: string;
  from_env: PromptEnv;
  to_env: PromptEnv;
  version_id: string;
  promoted_by: string;
  promoted_at: string;
}

export const environmentRepo = {
  async findByPrompt(
    supabase: SupabaseClient,
    promptId: string,
  ): Promise<PromptEnvironment[]> {
    const { data, error } = await supabase
      .from('prompt_environments')
      .select('*')
      .eq('prompt_id', promptId)
      .order('environment');

    if (error) throw new Error(`Failed to fetch environments: ${error.message}`);
    return (data ?? []).map(mapEnv);
  },

  async findByPromptAndEnv(
    supabase: SupabaseClient,
    promptId: string,
    env: PromptEnv,
  ): Promise<PromptEnvironment | null> {
    const { data, error } = await supabase
      .from('prompt_environments')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('environment', env)
      .single();

    if (error || !data) return null;
    return mapEnv(data);
  },

  async upsert(
    supabase: SupabaseClient,
    env: Omit<PromptEnvironment, 'id' | 'promoted_at'> & { promoted_at?: string },
  ): Promise<PromptEnvironment> {
    const { data, error } = await supabase
      .from('prompt_environments')
      .upsert(
        {
          prompt_id: env.prompt_id,
          environment: env.environment,
          version_id: env.version_id,
          version_number: env.version_number,
          content_md: env.content_md,
          blocks: env.blocks as unknown as Json,
          promoted_by: env.promoted_by,
          promoted_at: env.promoted_at ?? new Date().toISOString(),
        },
        { onConflict: 'prompt_id,environment' },
      )
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to upsert environment: ${error?.message}`);
    return mapEnv(data);
  },

  async insertPromotion(
    supabase: SupabaseClient,
    p: Omit<EnvironmentPromotion, 'id' | 'promoted_at'>,
  ): Promise<void> {
    const { error } = await supabase.from('environment_promotions').insert({
      prompt_id: p.prompt_id,
      from_env: p.from_env,
      to_env: p.to_env,
      version_id: p.version_id,
      promoted_by: p.promoted_by,
    });

    if (error) throw new Error(`Failed to log promotion: ${error.message}`);
  },

  async listPromotions(
    supabase: SupabaseClient,
    promptId: string,
  ): Promise<EnvironmentPromotion[]> {
    const { data, error } = await supabase
      .from('environment_promotions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('promoted_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Failed to list promotions: ${error.message}`);
    return (data ?? []) as EnvironmentPromotion[];
  },
};

function mapEnv(row: Record<string, unknown>): PromptEnvironment {
  return {
    id: row.id as string,
    prompt_id: row.prompt_id as string,
    environment: row.environment as PromptEnv,
    version_id: row.version_id as string | null,
    version_number: row.version_number as number | null,
    content_md: row.content_md as string | null,
    blocks: row.blocks as unknown as PromptBlock[] | null,
    promoted_by: row.promoted_by as string | null,
    promoted_at: row.promoted_at as string,
  };
}
