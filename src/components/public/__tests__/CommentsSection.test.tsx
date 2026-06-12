import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CommentThread } from '@/db/repositories/comment.repo';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockAddComment = vi.fn();
const mockLoadMore = vi.fn();

vi.mock('../hooks/useComments', () => ({
  useComments: (
    _promptId: string,
    initial: { threads: CommentThread[]; nextCursor: string | null },
  ) => ({
    threads: initial.threads,
    isLoading: false,
    hasMore: false,
    loadMore: mockLoadMore,
    addComment: mockAddComment,
    editComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleHelpful: vi.fn(),
    reportComment: vi.fn(),
  }),
}));

import { CommentsSection } from '../CommentsSection';

// ── Data ──────────────────────────────────────────────────────────────────────

const EMPTY_THREADS: CommentThread[] = [];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CommentsSection — not logged in', () => {
  it('shows "Komentarze (0)" heading', () => {
    render(
      <CommentsSection
        promptId="p1"
        initialThreads={EMPTY_THREADS}
        initialNextCursor={null}
        currentUserId={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByText('Komentarze (0)')).toBeTruthy();
  });

  it('shows login link for non-logged-in users', () => {
    render(
      <CommentsSection
        promptId="p1"
        initialThreads={EMPTY_THREADS}
        initialNextCursor={null}
        currentUserId={null}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByRole('link', { name: /Zaloguj się/i })).toBeTruthy();
  });
});

describe('CommentsSection — logged in', () => {
  it('shows comment form for logged-in users', () => {
    render(
      <CommentsSection
        promptId="p1"
        initialThreads={EMPTY_THREADS}
        initialNextCursor={null}
        currentUserId="u1"
        isLoggedIn={true}
      />,
    );
    expect(screen.getByPlaceholderText('Dodaj komentarz…')).toBeTruthy();
  });

  it('counts total comments including replies', () => {
    const threads: CommentThread[] = [
      {
        id: 'c1',
        prompt_id: 'p1',
        user_id: 'u1',
        parent_id: null,
        content: 'First comment',
        is_helpful: 0,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_name: 'Alice',
        avatar_url: null,
        replies: [
          {
            id: 'c2',
            prompt_id: 'p1',
            user_id: 'u2',
            parent_id: 'c1',
            content: 'A reply',
            is_helpful: 0,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            display_name: 'Bob',
            avatar_url: null,
          },
        ],
      },
    ];
    render(
      <CommentsSection
        promptId="p1"
        initialThreads={threads}
        initialNextCursor={null}
        currentUserId="u1"
        isLoggedIn={true}
      />,
    );
    // 1 thread + 1 reply = 2 total
    expect(screen.getByText('Komentarze (2)')).toBeTruthy();
  });
});
