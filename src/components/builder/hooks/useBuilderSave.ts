import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useBuilderStore } from '../store/builder.store';
import type { Lang } from '@/lib/i18n';

const AUTOSAVE_DELAY_MS = 30_000;

/**
 * Handles save flow for the builder:
 * - Manual save with toast feedback + auto-version snapshot
 * - Autosave every 30s when isDirty && !isSaving
 * - beforeunload warning when isDirty
 *
 * Returns `handleSave` to call from toolbar or keyboard shortcut.
 */
interface UseBuilderSaveOptions {
  onSaved?: (promptId: string) => void;
}

export function useBuilderSave(
  lang: Lang = 'pl',
  options: UseBuilderSaveOptions = {},
): { handleSave: () => Promise<void> } {
  const { onSaved } = options;
  const save = useBuilderStore((s) => s.save);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createVersionSilently = useCallback((promptId: string) => {
    void fetch(`/api/prompts/${promptId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await save();
      const promptId = useBuilderStore.getState().promptId;
      if (promptId) {
        createVersionSilently(promptId);
        onSaved?.(promptId);
      }
      toast.success(lang === 'pl' ? 'Prompt zapisany' : 'Prompt saved', { duration: 2000 });
    } catch {
      toast.error(lang === 'pl' ? 'Nie udało się zapisać' : 'Failed to save', {
        action: {
          label: lang === 'pl' ? 'Spróbuj ponownie' : 'Try again',
          onClick: () => { void handleSave(); },
        },
      });
    }
  }, [save, lang, createVersionSilently]);

  // Autosave: schedule save 30s after last change
  useEffect(() => {
    if (!isDirty || isSaving) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const state = useBuilderStore.getState();
      if (state.isDirty && !state.isSaving) {
        void handleSave();
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [isDirty, isSaving, handleSave]);

  // Warn before leaving when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useBuilderStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return { handleSave };
}
