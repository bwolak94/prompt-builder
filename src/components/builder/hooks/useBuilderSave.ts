import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useBuilderStore } from '../store/builder.store';

const AUTOSAVE_DELAY_MS = 30_000;

/**
 * Handles save flow for the builder:
 * - Manual save with toast feedback
 * - Autosave every 30s when isDirty && !isSaving
 * - beforeunload warning when isDirty
 *
 * Returns `handleSave` to call from toolbar or keyboard shortcut.
 */
export function useBuilderSave(): { handleSave: () => Promise<void> } {
  const save = useBuilderStore((s) => s.save);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(async () => {
    try {
      await save();
      toast.success('Prompt zapisany', { duration: 2000 });
    } catch {
      toast.error('Nie udało się zapisać', {
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => { void handleSave(); },
        },
      });
    }
  }, [save]);

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
