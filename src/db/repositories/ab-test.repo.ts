import type { SupabaseClient } from '@/db/supabase.client';
import type { PromptBlock } from '@/types';
import type { Json } from '@/db/types';
import type { ScoreResult } from '@/types';

export interface ABVariant {
  blocks: PromptBlock[];
  content_md: string;
}

export interface ABTest {
  id: string;
  user_id: string;
  prompt_id: string;
  variant_a: ABVariant;
  variant_b: ABVariant;
  score_a: ScoreResult | null;
  score_b: ScoreResult | null;
  response_a: string | null;
  response_b: string | null;
  model_used: string | null;
  winner: 'a' | 'b' | 'tie' | null;
  status: 'draft' | 'scored' | 'ran' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface CreateABTestData {
  userId: string;
  promptId: string;
  variantA: ABVariant;
  variantB: ABVariant;
}

function mapRow(row: {
  id: string;
  user_id: string;
  prompt_id: string;
  variant_a: Json;
  variant_b: Json;
  score_a: Json | null;
  score_b: Json | null;
  response_a: string | null;
  response_b: string | null;
  model_used: string | null;
  winner: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}): ABTest {
  return {
    id: row.id,
    user_id: row.user_id,
    prompt_id: row.prompt_id,
    variant_a: row.variant_a as unknown as ABVariant,
    variant_b: row.variant_b as unknown as ABVariant,
    score_a: row.score_a as unknown as ScoreResult | null,
    score_b: row.score_b as unknown as ScoreResult | null,
    response_a: row.response_a,
    response_b: row.response_b,
    model_used: row.model_used,
    winner: row.winner as ABTest['winner'],
    status: row.status as ABTest['status'],
    created_at: row.created_at,
    resolved_at: row.resolved_at,
  };
}

export const abTestRepo = {
  async create(supabase: SupabaseClient, data: CreateABTestData): Promise<ABTest> {
    const { data: row, error } = await supabase
      .from('ab_tests')
      .insert({
        user_id: data.userId,
        prompt_id: data.promptId,
        variant_a: data.variantA as unknown as Json,
        variant_b: data.variantB as unknown as Json,
      })
      .select()
      .single();

    if (error || !row) throw new Error(`Failed to create A/B test: ${error?.message}`);
    return mapRow(row as Parameters<typeof mapRow>[0]);
  },

  async findById(supabase: SupabaseClient, id: string): Promise<ABTest | null> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRow(data as Parameters<typeof mapRow>[0]);
  },

  async findByPrompt(supabase: SupabaseClient, promptId: string): Promise<ABTest[]> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list A/B tests: ${error.message}`);
    return (data ?? []).map((r) => mapRow(r as Parameters<typeof mapRow>[0]));
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    patch: Partial<{
      variant_b: ABVariant;
      score_a: ScoreResult;
      score_b: ScoreResult;
      response_a: string;
      response_b: string;
      model_used: string;
      winner: 'a' | 'b' | 'tie';
      status: ABTest['status'];
      resolved_at: string;
    }>,
  ): Promise<ABTest> {
    const { data, error } = await supabase
      .from('ab_tests')
      .update(patch as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update A/B test: ${error?.message}`);
    return mapRow(data as Parameters<typeof mapRow>[0]);
  },

  async deleteById(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('ab_tests').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete A/B test: ${error.message}`);
  },
};
