import type { SupabaseClient } from '@/db/supabase.client';
import type { PromptBlock, PromptVariable } from '@/types';
import type { Json } from '@/db/types';
import { castBlocks, castVariables } from '@/types';

export interface SystemTemplate {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  category: string;
  difficulty: string;
  tags: string[];
  blocks: PromptBlock[];
  variables: PromptVariable[];
  content_md: string;
  ai_score: number | null;
  fork_count: number;
  is_featured: boolean;
  order_index: number;
  created_at: string;
}

export interface TemplateFilters {
  category?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface TemplatesPage {
  data: SystemTemplate[];
  nextCursor: string | null;
}

function rowToTemplate(row: Record<string, unknown>): SystemTemplate {
  return {
    id: row.id as string,
    title: row.title as string,
    title_en: (row.title_en as string | null) ?? null,
    description: row.description as string,
    description_en: (row.description_en as string | null) ?? null,
    category: row.category as string,
    difficulty: row.difficulty as string,
    tags: (row.tags as string[]) ?? [],
    blocks: castBlocks(row.blocks as Json),
    variables: castVariables(row.variables as Json),
    content_md: row.content_md as string,
    ai_score: row.ai_score as number | null,
    fork_count: (row.fork_count as number) ?? 0,
    is_featured: (row.is_featured as boolean) ?? false,
    order_index: (row.order_index as number) ?? 0,
    created_at: row.created_at as string,
  };
}

export const templateRepo = {
  async findById(supabase: SupabaseClient, id: string): Promise<SystemTemplate | null> {
    const { data, error } = await supabase
      .from('system_templates')
      .select(
        'id,title,title_en,description,description_en,category,difficulty,tags,blocks,variables,content_md,ai_score,fork_count,is_featured,order_index,created_at',
      )
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return rowToTemplate(data as Record<string, unknown>);
  },

  async findMany(supabase: SupabaseClient, filters: TemplateFilters): Promise<TemplatesPage> {
    const limit = Math.min(filters.limit ?? 12, 50);

    let query = supabase
      .from('system_templates')
      .select(
        'id,title,title_en,description,description_en,category,difficulty,tags,blocks,variables,content_md,ai_score,fork_count,is_featured,order_index,created_at',
      )
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit + 1); // fetch one extra to detect nextCursor

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.search) {
      // Full-text search via Postgres to_tsquery
      query = query.textSearch('search_vector', filters.search, {
        type: 'websearch',
        config: 'english',
      });
    }
    if (filters.cursor) {
      // cursor = last item's order_index:created_at (combined cursor)
      query = query.gt('id', filters.cursor);
    }

    const { data, error } = await query;
    if (error || !data) return { data: [], nextCursor: null };

    const items = (data as Record<string, unknown>[]).map(rowToTemplate);
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    return { data: page, nextCursor };
  },
};
