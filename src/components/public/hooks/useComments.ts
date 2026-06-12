import { useState, useCallback } from 'react';
import type { Comment, CommentThread } from '@/db/repositories/comment.repo';

interface UseCommentsReturn {
  threads: CommentThread[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addComment: (content: string, parentId?: string) => Promise<void>;
  editComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  toggleHelpful: (id: string) => Promise<void>;
  reportComment: (id: string, reason: string) => Promise<void>;
}

interface CommentsPage {
  threads: CommentThread[];
  nextCursor: string | null;
}

export function useComments(promptId: string, initial: CommentsPage): UseCommentsReturn {
  const [threads, setThreads] = useState<CommentThread[]>(initial.threads);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/comments?cursor=${cursor}`);
      if (!res.ok) return;
      const { data } = (await res.json()) as { data: CommentsPage };
      setThreads((prev) => [...prev, ...data.threads]);
      setCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }, [promptId, cursor, isLoading]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    const res = await fetch(`/api/prompts/${promptId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? 'Failed to add comment');
    }
    const { data: newComment } = (await res.json()) as { data: CommentThread };

    setThreads((prev) => {
      if (!parentId) {
        return [{ ...newComment, replies: [] }, ...prev];
      }
      return prev.map((t) =>
        t.id === parentId ? { ...t, replies: [...t.replies, newComment] } : t,
      );
    });
  }, [promptId]);

  const editComment = useCallback(async (id: string, content: string) => {
    const res = await fetch(`/api/prompts/${promptId}/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to edit comment');
    const { data: updated } = (await res.json()) as { data: CommentThread };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, content: updated.content };
        return { ...t, replies: t.replies.map((r) => r.id === id ? { ...r, content: updated.content } : r) };
      }),
    );
  }, [promptId]);

  const deleteComment = useCallback(async (id: string) => {
    await fetch(`/api/prompts/${promptId}/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    setThreads((prev) =>
      prev
        .filter((t) => t.id !== id)
        .map((t) => ({ ...t, replies: t.replies.filter((r) => r.id !== id) })),
    );
  }, [promptId]);

  const toggleHelpful = useCallback(async (id: string) => {
    const res = await fetch(`/api/prompts/${promptId}/comments/${id}/helpful`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: { helpful: boolean; count: number } };

    const updateComment = <T extends Comment>(c: T): T =>
      c.id === id ? { ...c, is_helpful: data.count, viewer_helpful: data.helpful } : c;

    setThreads((prev) =>
      prev.map((t) => ({ ...updateComment(t), replies: t.replies.map(updateComment) })),
    );
  }, [promptId]);

  const reportComment = useCallback(async (id: string, reason: string) => {
    await fetch(`/api/prompts/${promptId}/comments/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  }, [promptId]);

  return {
    threads,
    isLoading,
    hasMore: cursor !== null,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    toggleHelpful,
    reportComment,
  };
}
