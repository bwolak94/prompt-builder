import { useState, useCallback, useRef, useEffect } from 'react';
import type { SystemTemplate } from '@/db/repositories/template.repo';

export interface TemplateFilters {
  search: string;
  category: string;
  difficulty: string;
}

interface UseTemplatesState {
  templates: SystemTemplate[];
  isLoading: boolean;
  isFetchingMore: boolean;
  nextCursor: string | null;
  error: string | null;
}

export function useTemplates(initialTemplates: SystemTemplate[]) {
  const [state, setState] = useState<UseTemplatesState>({
    templates: initialTemplates,
    isLoading: false,
    isFetchingMore: false,
    nextCursor: null,
    error: null,
  });
  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
    category: 'all',
    difficulty: 'all',
  });

  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback((f: TemplateFilters, cursor?: string): string => {
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.category !== 'all') params.set('category', f.category);
    if (f.difficulty !== 'all') params.set('difficulty', f.difficulty);
    if (cursor) params.set('cursor', cursor);
    return `/api/templates?${params.toString()}`;
  }, []);

  const fetch_ = useCallback(
    async (f: TemplateFilters, append = false) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setState((prev) => ({
        ...prev,
        isLoading: !append,
        isFetchingMore: append,
        error: null,
      }));

      try {
        const cursor = append ? state.nextCursor ?? undefined : undefined;
        const res = await fetch(buildUrl(f, cursor), { signal: ctrl.signal });
        if (!res.ok) throw new Error('Fetch failed');
        const json = (await res.json()) as {
          data: SystemTemplate[];
          nextCursor: string | null;
        };

        setState((prev) => ({
          templates: append ? [...prev.templates, ...json.data] : json.data,
          isLoading: false,
          isFetchingMore: false,
          nextCursor: json.nextCursor,
          error: null,
        }));

        // Sync URL params
        const url = new URL(window.location.href);
        if (f.search) url.searchParams.set('search', f.search);
        else url.searchParams.delete('search');
        if (f.category !== 'all') url.searchParams.set('category', f.category);
        else url.searchParams.delete('category');
        if (f.difficulty !== 'all') url.searchParams.set('difficulty', f.difficulty);
        else url.searchParams.delete('difficulty');
        history.pushState({}, '', url.toString());
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isFetchingMore: false,
          error: 'Nie udało się załadować szablonów.',
        }));
      }
    },
    [buildUrl, state.nextCursor],
  );

  const updateFilters = useCallback(
    (patch: Partial<TemplateFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        // Don't call fetch_ directly during state update - use effect
        return next;
      });
    },
    [],
  );

  // Refetch when filters change
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (prevFiltersRef.current !== filters) {
      prevFiltersRef.current = filters;
      fetch_(filters, false);
    }
  }, [filters, fetch_]);

  const fetchMore = useCallback(() => {
    if (state.nextCursor && !state.isFetchingMore) {
      fetch_(filters, true);
    }
  }, [state.nextCursor, state.isFetchingMore, filters, fetch_]);

  return { ...state, filters, updateFilters, fetchMore };
}
