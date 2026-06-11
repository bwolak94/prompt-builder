import type { SupabaseClient } from '@/db/supabase.client';
import type { Prompt } from '@/types';
import type { Database } from '@/db/types';
import { castBlocks, castVariables } from '@/types';

type PromptsRow = Database['public']['Tables']['prompts']['Row'];
type PromptsInsert = Database['public']['Tables']['prompts']['Insert'];
type PromptsUpdate = Database['public']['Tables']['prompts']['Update'];

// ── Row → domain mapper ────────────────────────────────────────────────────────

function rowToPrompt(row: PromptsRow): Prompt {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    blocks: castBlocks(row.blocks),
    variables: castVariables(row.variables),
    content_md: row.content_md,
    tags: row.tags,
    is_public: row.is_public,
    slug: row.slug,
    fork_of: row.fork_of,
    fork_count: row.fork_count,
    view_count: row.view_count,
    category: row.category ?? null,
    difficulty: row.difficulty ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

// ── Repository ─────────────────────────────────────────────────────────────────

export const promptRepo = {
  async findById(supabase: SupabaseClient, id: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return rowToPrompt(data);
  },

  async findByUserId(supabase: SupabaseClient, userId: string): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];
    return data.map(rowToPrompt);
  },

  async findBySlug(supabase: SupabaseClient, slug: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return rowToPrompt(data);
  },

  async slugExists(supabase: SupabaseClient, slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('prompts')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();
    return data !== null;
  },

  async create(supabase: SupabaseClient, insert: PromptsInsert): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .insert(insert)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to create prompt');
    return rowToPrompt(data);
  },

  async update(supabase: SupabaseClient, id: string, patch: PromptsUpdate): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update prompt');
    return rowToPrompt(data);
  },

  async softDelete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  incrementViewCount(supabase: SupabaseClient, id: string): void {
    // fire-and-forget: do not await
    supabase.rpc('increment_view_count', { prompt_id: id }).then(() => {});
  },

  incrementForkCount(supabase: SupabaseClient, id: string): void {
    // fire-and-forget: do not await
    supabase.rpc('increment_fork_count', { prompt_id: id }).then(() => {});
  },
};
