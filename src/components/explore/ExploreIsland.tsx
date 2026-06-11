import React, { useEffect, useRef, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { TemplateCard, TemplateCardSkeleton } from './components/TemplateCard';
import { useTemplates } from './hooks/useTemplates';
import type { SystemTemplate } from '@/db/repositories/template.repo';

interface ExploreIslandProps {
  initialTemplates: SystemTemplate[];
}

export const ExploreIsland: React.FC<ExploreIslandProps> = ({ initialTemplates }) => {
  const { templates, isLoading, isFetchingMore, nextCursor, error, filters, updateFilters, fetchMore } =
    useTemplates(initialTemplates);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore]);

  const handleFork = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/prompts/${id}/fork`, { method: 'POST' });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else if (res.status === 401) {
        window.location.href = `/register?fork=${id}`;
      }
    },
    [],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Explore</h1>
        <p className="mt-1 text-sm text-text-muted">
          Przeglądaj gotowe szablony i twórz na ich podstawie własne prompty
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <SearchBar value={filters.search} onChange={(v) => updateFilters({ search: v })} />
        <FilterPanel
          category={filters.category}
          difficulty={filters.difficulty}
          onCategoryChange={(v) => updateFilters({ category: v })}
          onDifficultyChange={(v) => updateFilters({ difficulty: v })}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-text-primary">Brak wyników</p>
          <p className="text-xs text-text-muted">Spróbuj zmienić filtry lub wyszukiwaną frazę</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} onFork={handleFork} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {nextCursor && (
            <div ref={sentinelRef} className="mt-4">
              {isFetchingMore && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TemplateCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreIsland;
