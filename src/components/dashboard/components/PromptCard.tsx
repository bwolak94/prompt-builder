import React, { useCallback } from 'react';
import { Edit2, Copy, Share2, Trash2, Globe, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Prompt } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  return `${Math.floor(hrs / 24)}d temu`;
}

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onFork: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onDelete, onFork }) => {
  const handleShare = useCallback(() => {
    if (prompt.slug) {
      const url = `${window.location.origin}/p/${prompt.slug}`;
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [prompt.slug]);

  return (
    <article className="group relative flex flex-col rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-brand-500/40">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
            prompt.is_public
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-zinc-500/10 text-text-muted',
          ].join(' ')}
        >
          {prompt.is_public ? (
            <><Globe size={10} aria-hidden="true" /> Publiczny</>
          ) : (
            <><Lock size={10} aria-hidden="true" /> Prywatny</>
          )}
        </span>
        <time className="text-xs text-text-muted" dateTime={prompt.updated_at}>
          {timeAgo(prompt.updated_at)}
        </time>
      </div>

      {/* Title */}
      <h2 className="truncate text-sm font-semibold text-text-primary">
        {prompt.title || 'Bez tytułu'}
      </h2>

      {/* Description */}
      {prompt.description && (
        <p className="mt-1 line-clamp-2 text-xs text-text-muted">{prompt.description}</p>
      )}

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
              {tag}
            </Badge>
          ))}
          {prompt.tags.length > 4 && (
            <span className="text-[10px] text-text-muted">+{prompt.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
        <span>{prompt.blocks.length} bloków</span>
        {prompt.view_count > 0 && <span>👁 {prompt.view_count}</span>}
        {prompt.fork_count > 0 && <span>🍴 {prompt.fork_count}</span>}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <a
          href={`/builder/${prompt.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-400 transition-colors hover:bg-brand-500/20"
          aria-label={`Edytuj prompt: ${prompt.title}`}
        >
          <Edit2 size={11} aria-hidden="true" /> Edytuj
        </a>

        <button
          onClick={() => onFork(prompt.id)}
          className="rounded-md border border-border p-1.5 text-text-muted transition-colors hover:text-text-primary"
          aria-label="Duplikuj prompt"
          title="Duplikuj"
        >
          <Copy size={12} aria-hidden="true" />
        </button>

        {prompt.is_public && prompt.slug && (
          <button
            onClick={handleShare}
            className="rounded-md border border-border p-1.5 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Kopiuj link do promptu"
            title="Udostępnij"
          >
            <Share2 size={12} aria-hidden="true" />
          </button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded-md border border-border p-1.5 text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
              aria-label={`Usuń prompt: ${prompt.title}`}
              title="Usuń"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usuń prompt</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz usunąć &ldquo;{prompt.title}&rdquo;? Tej akcji nie można cofnąć.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(prompt.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
};
