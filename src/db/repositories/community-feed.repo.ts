import type { SupabaseClient } from '@/db/supabase.client';

export type FeedTab = 'trending' | 'recent' | 'top_rated' | 'featured';
export type FeedPeriod = '24h' | 'week' | 'month' | 'all';

export interface FeedFilters {
  tab: FeedTab;
  category?: string;
  period?: FeedPeriod;
  cursor?: string;
  limit?: number;
}

export interface TrendingPrompt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  fork_count: number;
  view_count: number;
  avg_rating: number;
  rating_count: number;
  comment_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  trending_score: number;
  author_name: string;
  author_avatar: string | null;
}

export interface FeedPage {
  items: TrendingPrompt[];
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

function periodToDate(period: FeedPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

export const communityFeedRepo = {
  async findFeed(supabase: SupabaseClient, filters: FeedFilters): Promise<FeedPage> {
    const limit = Math.min(filters.limit ?? PAGE_SIZE, PAGE_SIZE);
    const since = filters.period ? periodToDate(filters.period) : null;

    let query = supabase
      .from('trending_prompts')
      .select(
        'id,user_id,title,description,tags,fork_count,view_count,avg_rating,rating_count,comment_count,is_featured,created_at,updated_at,trending_score,author_name,author_avatar',
      );

    // Category filter via tags array contains
    if (filters.category) {
      query = query.contains('tags', [filters.category]);
    }

    // Period filter
    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    // Tab-specific ordering and conditions
    switch (filters.tab) {
      case 'trending':
        if (filters.cursor) query = query.lt('trending_score', parseFloat(filters.cursor));
        query = query.order('trending_score', { ascending: false });
        break;

      case 'recent':
        if (filters.cursor) query = query.lt('created_at', filters.cursor);
        query = query.order('created_at', { ascending: false });
        break;

      case 'top_rated':
        query = query.gte('avg_rating', 4).gte('rating_count', 5);
        if (filters.cursor) query = query.lt('avg_rating', parseFloat(filters.cursor));
        query = query
          .order('avg_rating', { ascending: false })
          .order('rating_count', { ascending: false });
        break;

      case 'featured':
        query = query.eq('is_featured', true);
        if (filters.cursor) query = query.lt('updated_at', filters.cursor);
        query = query.order('updated_at', { ascending: false });
        break;
    }

    query = query.limit(limit + 1);

    const { data, error } = await query;
    if (error) throw new Error(`Feed query failed: ${error.message}`);

    const rows = (data ?? []) as TrendingPrompt[];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      if (!last) return { items, nextCursor };
      switch (filters.tab) {
        case 'trending':
          nextCursor = String(last.trending_score);
          break;
        case 'recent':
          nextCursor = last.created_at;
          break;
        case 'top_rated':
          nextCursor = String(last.avg_rating);
          break;
        case 'featured':
          nextCursor = last.updated_at;
          break;
      }
    }

    return { items, nextCursor };
  },

  async findFeatured(supabase: SupabaseClient, limit = 3): Promise<TrendingPrompt[]> {
    const { data, error } = await supabase
      .from('trending_prompts')
      .select(
        'id,user_id,title,description,tags,fork_count,view_count,avg_rating,rating_count,comment_count,is_featured,created_at,updated_at,trending_score,author_name,author_avatar',
      )
      .eq('is_featured', true)
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Featured query failed: ${error.message}`);
    return (data ?? []) as TrendingPrompt[];
  },

  async setFeatured(supabase: SupabaseClient, promptId: string, featured: boolean): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .update({ is_featured: featured })
      .eq('id', promptId);
    if (error) throw new Error(`setFeatured failed: ${error.message}`);
  },
};
