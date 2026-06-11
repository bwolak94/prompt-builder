import type { SupabaseClient } from '@/db/supabase.client';

export interface Comment {
  id: string;
  prompt_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_helpful: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from profiles */
  display_name?: string;
  avatar_url?: string | null;
  /** Whether the current user has marked this helpful */
  viewer_helpful?: boolean;
}

export interface CommentThread extends Comment {
  replies: Comment[];
}

const PAGE_SIZE = 20;

function mapRow(row: Record<string, unknown>, userId?: string): Comment {
  const profile = row.profiles as { display_name?: string; avatar_url?: string | null } | null;
  const helpfulRows = row.comment_helpful as Array<{ user_id: string }> | null;

  return {
    id: row.id as string,
    prompt_id: row.prompt_id as string,
    user_id: row.user_id as string,
    parent_id: (row.parent_id as string | null) ?? null,
    content: row.content as string,
    is_helpful: (row.is_helpful as number) ?? 0,
    deleted_at: (row.deleted_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    display_name: profile?.display_name ?? 'Anonymous',
    avatar_url: profile?.avatar_url ?? null,
    viewer_helpful: userId ? (helpfulRows?.some((h) => h.user_id === userId) ?? false) : false,
  };
}

export const commentRepo = {
  /**
   * List top-level comments with their replies (max depth 2).
   * Returns cursor for next page.
   */
  async listThreaded(
    supabase: SupabaseClient,
    promptId: string,
    cursor?: string,
    userId?: string,
  ): Promise<{ threads: CommentThread[]; nextCursor: string | null }> {
    let query = supabase
      .from('prompt_comments')
      .select(`
        id, prompt_id, user_id, parent_id, content, is_helpful, deleted_at, created_at, updated_at,
        profiles ( display_name, avatar_url ),
        comment_helpful ( user_id )
      `)
      .eq('prompt_id', promptId)
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: topRows, error } = await query;
    if (error) throw new Error(`Failed to list comments: ${error.message}`);

    const rows = (topRows ?? []) as unknown as Record<string, unknown>[];
    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? (pageRows[pageRows.length - 1]?.created_at as string) : null;

    const topComments = pageRows.map((r) => mapRow(r, userId));
    const topIds = topComments.map((c) => c.id);

    // Fetch all replies for this page in one query
    let replies: Comment[] = [];
    if (topIds.length > 0) {
      const { data: replyRows } = await supabase
        .from('prompt_comments')
        .select(`
          id, prompt_id, user_id, parent_id, content, is_helpful, deleted_at, created_at, updated_at,
          profiles ( display_name, avatar_url ),
          comment_helpful ( user_id )
        `)
        .in('parent_id', topIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      replies = ((replyRows ?? []) as unknown as Record<string, unknown>[]).map((r) =>
        mapRow(r, userId),
      );
    }

    const threads: CommentThread[] = topComments.map((comment) => ({
      ...comment,
      replies: replies.filter((r) => r.parent_id === comment.id),
    }));

    return { threads, nextCursor };
  },

  async create(
    supabase: SupabaseClient,
    promptId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from('prompt_comments')
      .insert({ prompt_id: promptId, user_id: userId, content, parent_id: parentId ?? null })
      .select(`
        id, prompt_id, user_id, parent_id, content, is_helpful, deleted_at, created_at, updated_at,
        profiles ( display_name, avatar_url )
      `)
      .single();

    if (error || !data) throw new Error(`Failed to create comment: ${error?.message}`);
    return mapRow(data as unknown as Record<string, unknown>, userId);
  },

  async update(supabase: SupabaseClient, id: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('prompt_comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        id, prompt_id, user_id, parent_id, content, is_helpful, deleted_at, created_at, updated_at,
        profiles ( display_name, avatar_url )
      `)
      .single();

    if (error || !data) throw new Error(`Failed to update comment: ${error?.message}`);
    return mapRow(data as unknown as Record<string, unknown>);
  },

  /** Soft delete — sets deleted_at. RLS ensures only owner can do this. */
  async softDelete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(`Failed to delete comment: ${error.message}`);
  },

  /** Toggle helpful: returns new count. */
  async toggleHelpful(
    supabase: SupabaseClient,
    commentId: string,
    userId: string,
  ): Promise<{ helpful: boolean; count: number }> {
    // Check if already marked
    const { data: existing } = await supabase
      .from('comment_helpful')
      .select('user_id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    let helpful: boolean;
    if (existing) {
      await supabase
        .from('comment_helpful')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      helpful = false;
    } else {
      await supabase
        .from('comment_helpful')
        .insert({ comment_id: commentId, user_id: userId });
      helpful = true;
    }

    // Update denormalised count
    const { count } = await supabase
      .from('comment_helpful')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    const newCount = count ?? 0;
    await supabase
      .from('prompt_comments')
      .update({ is_helpful: newCount })
      .eq('id', commentId);

    return { helpful, count: newCount };
  },

  async report(
    supabase: SupabaseClient,
    commentId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('comment_reports')
      .insert({ comment_id: commentId, user_id: userId, reason });
    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to report: ${error.message}`);
    }
  },
};
