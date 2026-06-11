import type { SupabaseClient } from '@/db/supabase.client';
import type { Prompt } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  depth: number;
  is_public: boolean;
  slug: string | null;
  color: string | null;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithCount extends Collection {
  prompt_count: number;
  children_count: number;
}

export interface CollectionNode extends CollectionWithCount {
  children: CollectionNode[];
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  is_public?: boolean;
  color?: string;
  icon?: string;
  order_index?: number;
  slug?: string | null;
}

// ── Repository ────────────────────────────────────────────────────────────────

export const collectionRepo = {
  /** All collections for a user, flat list with counts. */
  async findByUser(supabase: SupabaseClient, userId: string): Promise<CollectionWithCount[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id, user_id, name, description, parent_id, depth,
        is_public, slug, color, icon, order_index, created_at, updated_at,
        collection_prompts ( count )
      `)
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(`findByUser failed: ${error.message}`);

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

    // Build prompt_count + children_count in a second pass
    const idSet = new Set(rows.map((r) => r.id as string));

    return rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      parent_id: (row.parent_id as string | null) ?? null,
      depth: (row.depth as number) ?? 0,
      is_public: (row.is_public as boolean) ?? false,
      slug: (row.slug as string | null) ?? null,
      color: (row.color as string | null) ?? null,
      icon: (row.icon as string | null) ?? null,
      order_index: (row.order_index as number) ?? 0,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      prompt_count:
        (row.collection_prompts as Array<{ count: number }> | null)?.[0]?.count ?? 0,
      children_count: rows.filter(
        (r) => r.parent_id === row.id && idSet.has(r.id as string),
      ).length,
    }));
  },

  async findById(supabase: SupabaseClient, id: string): Promise<Collection | null> {
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return (data as Collection | null) ?? null;
  },

  async findBySlug(supabase: SupabaseClient, slug: string): Promise<Collection | null> {
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return (data as Collection | null) ?? null;
  },

  async create(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateCollectionDto,
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, ...dto })
      .select()
      .single();
    if (error || !data) throw new Error(`create collection failed: ${error?.message}`);
    return data as Collection;
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(`update collection failed: ${error?.message}`);
    return data as Collection;
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw new Error(`delete collection failed: ${error.message}`);
  },

  /** Prompts in a collection (for public bundle or filtered dashboard). */
  async findPromptsInCollection(
    supabase: SupabaseClient,
    collectionId: string,
  ): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('collection_prompts')
      .select('prompts ( * )')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (error) throw new Error(`findPrompts failed: ${error.message}`);
    return ((data ?? []) as unknown as Array<{ prompts: Prompt }>).map((r) => r.prompts);
  },

  async addPrompt(
    supabase: SupabaseClient,
    collectionId: string,
    promptId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('collection_prompts')
      .insert({ collection_id: collectionId, prompt_id: promptId });
    if (error && !error.message.includes('duplicate')) {
      throw new Error(`addPrompt failed: ${error.message}`);
    }
  },

  async removePrompt(
    supabase: SupabaseClient,
    collectionId: string,
    promptId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('collection_prompts')
      .delete()
      .eq('collection_id', collectionId)
      .eq('prompt_id', promptId);
    if (error) throw new Error(`removePrompt failed: ${error.message}`);
  },

  /** Returns IDs of collections containing a prompt (for the user). */
  async getPromptCollectionIds(
    supabase: SupabaseClient,
    promptId: string,
    userId: string,
  ): Promise<string[]> {
    const { data } = await supabase
      .from('collection_prompts')
      .select('collection_id, collections!inner ( user_id )')
      .eq('prompt_id', promptId)
      .eq('collections.user_id', userId);

    return ((data ?? []) as Array<{ collection_id: string }>).map((r) => r.collection_id);
  },
};
