import React, { useOptimistic, useTransition, useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { StatsRow, type Stats } from './components/StatsRow';
import { FilterBar, type FilterValue } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { EmptyState } from './components/EmptyState';
import type { Prompt } from '@/types';

interface DashboardIslandProps {
  initialPrompts: Prompt[];
  initialStats: Stats;
}

export const DashboardIsland: React.FC<DashboardIslandProps> = ({
  initialPrompts,
  initialStats,
}) => {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [stats] = useState<Stats>(initialStats);
  const [isPending, startTransition] = useTransition();

  const [prompts, optimisticDelete] = useOptimistic(
    initialPrompts,
    (state: Prompt[], deletedId: string) => state.filter((p) => p.id !== deletedId),
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        optimisticDelete(id);
        await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
      });
    },
    [optimisticDelete],
  );

  const handleFork = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}/fork`, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'public':
        return prompts.filter((p) => p.is_public);
      case 'private':
        return prompts.filter((p) => !p.is_public);
      case 'unscored':
        return prompts; // simplified — real impl would join ratings
      default:
        return prompts;
    }
  }, [prompts, filter]);

  const counts = useMemo(
    () => ({
      all: prompts.length,
      public: prompts.filter((p) => p.is_public).length,
      private: prompts.filter((p) => !p.is_public).length,
      unscored: prompts.length,
    }),
    [prompts],
  );

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Moje prompty</h1>
          <p className="mt-1 text-sm text-text-muted">Zarządzaj swoją biblioteką promptów</p>
        </div>
        <a
          href="/builder"
          className="hidden items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 sm:flex"
        >
          <Plus size={16} aria-hidden="true" />
          Nowy prompt
        </a>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsRow stats={stats} />
      </div>

      {/* Filter tabs */}
      <div className="mb-5">
        <FilterBar active={filter} counts={counts} onChange={(f) => startTransition(() => setFilter(f))} />
      </div>

      {/* Grid */}
      <div aria-busy={isPending}>
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" role="list">
            {filtered.map((prompt) => (
              <li key={prompt.id}>
                <PromptCard
                  prompt={prompt}
                  onDelete={handleDelete}
                  onFork={handleFork}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB — mobile */}
      <a
        href="/builder"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-colors hover:bg-brand-600 sm:hidden"
        aria-label="Nowy prompt"
      >
        <Plus size={24} aria-hidden="true" />
      </a>
    </div>
  );
};

export default DashboardIsland;
