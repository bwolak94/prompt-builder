import type { SupabaseClient } from '@/db/supabase.client';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface ChainNode {
  id: string;
  chain_id: string;
  prompt_id: string | null;
  title: string;
  content_md: string;
  order_index: number;
  created_at: string;
}

export interface PromptChain {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptChainWithNodes extends PromptChain {
  nodes: ChainNode[];
}

export interface CreateChainDto {
  title: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateChainDto {
  title?: string;
  description?: string;
  is_public?: boolean;
}

export interface CreateNodeDto {
  title?: string;
  content_md?: string;
  prompt_id?: string | null;
  order_index?: number;
}

export interface UpdateNodeDto {
  title?: string;
  content_md?: string;
  prompt_id?: string | null;
}

// ── Repository ─────────────────────────────────────────────────────────────────

export const chainRepo = {
  async findByUser(supabase: SupabaseClient, userId: string): Promise<PromptChain[]> {
    const { data, error } = await supabase
      .from('prompt_chains')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];
    return data as PromptChain[];
  },

  async findById(
    supabase: SupabaseClient,
    id: string,
  ): Promise<PromptChainWithNodes | null> {
    const { data: chain, error } = await supabase
      .from('prompt_chains')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !chain) return null;

    const { data: nodes } = await supabase
      .from('chain_nodes')
      .select('*')
      .eq('chain_id', id)
      .order('order_index', { ascending: true });

    return { ...(chain as PromptChain), nodes: (nodes ?? []) as ChainNode[] };
  },

  async create(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateChainDto,
  ): Promise<PromptChain> {
    const { data, error } = await supabase
      .from('prompt_chains')
      .insert({
        user_id: userId,
        title: dto.title,
        description: dto.description ?? null,
        is_public: dto.is_public ?? false,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to create chain');
    return data as PromptChain;
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    dto: UpdateChainDto,
  ): Promise<PromptChain> {
    const { data, error } = await supabase
      .from('prompt_chains')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update chain');
    return data as PromptChain;
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('prompt_chains').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ── Nodes ────────────────────────────────────────────────────────────────────

  async addNode(
    supabase: SupabaseClient,
    chainId: string,
    dto: CreateNodeDto,
  ): Promise<ChainNode> {
    const { data, error } = await supabase
      .from('chain_nodes')
      .insert({
        chain_id: chainId,
        title: dto.title ?? '',
        content_md: dto.content_md ?? '',
        prompt_id: dto.prompt_id ?? null,
        order_index: dto.order_index ?? 0,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to add node');
    return data as ChainNode;
  },

  async updateNode(
    supabase: SupabaseClient,
    nodeId: string,
    dto: UpdateNodeDto,
  ): Promise<ChainNode> {
    const { data, error } = await supabase
      .from('chain_nodes')
      .update(dto)
      .eq('id', nodeId)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update node');
    return data as ChainNode;
  },

  async deleteNode(supabase: SupabaseClient, nodeId: string): Promise<void> {
    const { error } = await supabase.from('chain_nodes').delete().eq('id', nodeId);
    if (error) throw new Error(error.message);
  },

  async reorderNodes(
    supabase: SupabaseClient,
    chainId: string,
    orderedIds: string[],
  ): Promise<void> {
    // Update order_index for each node in parallel
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('chain_nodes')
          .update({ order_index: index })
          .eq('id', id)
          .eq('chain_id', chainId),
      ),
    );
  },
};
