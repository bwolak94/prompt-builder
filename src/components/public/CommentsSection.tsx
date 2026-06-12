/**
 * CommentsSection — F-05
 * Threaded comments for public prompt pages.
 * Renders as a React island (client:load).
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useComments } from './hooks/useComments';
import type { CommentThread, Comment } from '@/db/repositories/comment.repo';

interface CommentsSectionProps {
  promptId: string;
  initialThreads: CommentThread[];
  initialNextCursor: string | null;
  currentUserId: string | null;
  isLoggedIn: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  promptId,
  initialThreads,
  initialNextCursor,
  currentUserId,
  isLoggedIn,
}) => {
  const {
    threads,
    isLoading,
    hasMore,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    toggleHelpful,
    reportComment,
  } = useComments(promptId, { threads: initialThreads, nextCursor: initialNextCursor });

  const totalCount = threads.length + threads.reduce((s, t) => s + t.replies.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-text-primary text-sm font-semibold">Komentarze ({totalCount})</h2>

      {/* Add comment form */}
      {isLoggedIn ? (
        <CommentForm onSubmit={(c) => addComment(c)} placeholder="Dodaj komentarz…" />
      ) : (
        <p className="text-text-muted text-xs">
          <a href="/login" className="text-brand-400 hover:underline">
            Zaloguj się
          </a>{' '}
          aby komentować
        </p>
      )}

      {/* Comment list */}
      <div className="flex flex-col gap-4">
        {threads.map((thread) => (
          <CommentThreadItem
            key={thread.id}
            thread={thread}
            currentUserId={currentUserId}
            isLoggedIn={isLoggedIn}
            onReply={(content) => addComment(content, thread.id)}
            onEdit={editComment}
            onDelete={deleteComment}
            onHelpful={toggleHelpful}
            onReport={reportComment}
          />
        ))}
      </div>

      {hasMore && (
        <Button variant="outline" size="sm" disabled={isLoading} onClick={() => void loadMore()}>
          {isLoading ? 'Ładowanie…' : 'Załaduj więcej'}
        </Button>
      )}

      {threads.length === 0 && (
        <p className="text-text-muted py-4 text-center text-xs">Brak komentarzy. Bądź pierwszy!</p>
      )}
    </div>
  );
};

// ── CommentForm ───────────────────────────────────────────────────────────────

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  placeholder = 'Dodaj komentarz…',
  onCancel,
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(content.trim());
      setContent('');
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="min-h-0 resize-none text-xs"
      />
      {error && <p className="text-destructive text-[10px]">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Anuluj
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? 'Wysyłanie…' : 'Wyślij'}
        </Button>
      </div>
    </form>
  );
};

// ── CommentThreadItem ─────────────────────────────────────────────────────────

interface ThreadItemProps {
  thread: CommentThread;
  currentUserId: string | null;
  isLoggedIn: boolean;
  onReply: (content: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onHelpful: (id: string) => Promise<void>;
  onReport: (id: string, reason: string) => Promise<void>;
}

const CommentThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  currentUserId,
  isLoggedIn,
  onReply,
  onEdit,
  onDelete,
  onHelpful,
  onReport,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <CommentCard
        comment={thread}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
        onEdit={onEdit}
        onDelete={onDelete}
        onHelpful={onHelpful}
        onReport={onReport}
        onReplyClick={isLoggedIn ? () => setShowReplyForm((v) => !v) : undefined}
      />

      {/* Replies */}
      {thread.replies.length > 0 && (
        <div className="border-border ml-6 flex flex-col gap-2 border-l-2 pl-3">
          {thread.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              onEdit={onEdit}
              onDelete={onDelete}
              onHelpful={onHelpful}
              onReport={onReport}
              isReply
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="border-border ml-6 border-l-2 pl-3">
          <CommentForm
            onSubmit={onReply}
            placeholder="Odpowiedz na komentarz…"
            onCancel={() => setShowReplyForm(false)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

// ── CommentCard ───────────────────────────────────────────────────────────────

interface CardProps {
  comment: Comment;
  currentUserId: string | null;
  isLoggedIn: boolean;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onHelpful: (id: string) => Promise<void>;
  onReport: (id: string, reason: string) => Promise<void>;
  onReplyClick?: () => void;
  isReply?: boolean;
}

const REPORT_REASONS = ['spam', 'abuse', 'offtopic', 'other'] as const;

const CommentCard: React.FC<CardProps> = ({
  comment,
  currentUserId,
  isLoggedIn,
  onEdit,
  onDelete,
  onHelpful,
  onReport,
  onReplyClick,
  isReply = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const isOwner = currentUserId === comment.user_id;

  const formatDate = (iso: string) =>
    new Intl.RelativeTimeFormat('pl', { numeric: 'auto' }).format(
      Math.round((new Date(iso).getTime() - Date.now()) / 60000),
      'minutes',
    );

  if (editing) {
    return (
      <div className="border-border bg-surface-raised rounded-lg border p-3">
        <CommentForm
          onSubmit={async (c) => {
            await onEdit(comment.id, c);
            setEditing(false);
          }}
          placeholder={comment.content}
          onCancel={() => setEditing(false)}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="border-border bg-surface-raised rounded-lg border p-3">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {comment.avatar_url ? (
            <img src={comment.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="bg-brand-500/20 text-brand-400 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
              {(comment.display_name ?? 'A')[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-text-primary text-xs font-medium">{comment.display_name}</span>
        </div>
        <time className="text-text-muted text-[10px]" dateTime={comment.created_at}>
          {formatDate(comment.created_at)}
        </time>
      </div>

      {/* Content */}
      <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="mt-2 flex items-center gap-3">
        {isLoggedIn && (
          <button
            onClick={() => void onHelpful(comment.id)}
            className={`flex items-center gap-1 text-[10px] transition-colors ${
              comment.viewer_helpful ? 'text-brand-400' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            👍 {comment.is_helpful > 0 && <span>{comment.is_helpful}</span>}
            Pomocny
          </button>
        )}

        {!isReply && onReplyClick && (
          <button
            onClick={onReplyClick}
            className="text-text-muted hover:text-text-primary text-[10px] transition-colors"
          >
            Odpowiedz
          </button>
        )}

        {isOwner && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-text-muted hover:text-text-primary text-[10px] transition-colors"
            >
              Edytuj
            </button>
            <button
              onClick={() => void onDelete(comment.id)}
              className="text-[10px] text-red-400/70 transition-colors hover:text-red-400"
            >
              Usuń
            </button>
          </>
        )}

        {isLoggedIn && !isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowReport((v) => !v)}
              className="text-text-muted/50 hover:text-text-muted text-[10px] transition-colors"
            >
              Zgłoś
            </button>
            {showReport && (
              <div className="border-border bg-surface-raised absolute bottom-5 left-0 z-10 flex flex-col rounded-md border shadow-lg">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      void onReport(comment.id, r);
                      setShowReport(false);
                    }}
                    className="text-text-muted hover:bg-surface-overlay hover:text-text-primary px-3 py-1.5 text-left text-xs"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
