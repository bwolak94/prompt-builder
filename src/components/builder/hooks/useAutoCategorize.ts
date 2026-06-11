import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { PromptSuggestion } from '@/lib/services/auto-categorize.service';
import type { Lang } from '@/lib/i18n';

interface UseAutoCategorizeResult {
  isLoading: boolean;
  suggestion: PromptSuggestion | null;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  suggestAndToast: (promptId: string) => void;
  applyTags: (promptId: string, data: PromptSuggestion) => Promise<void>;
}

export function useAutoCategorize(lang: Lang = 'pl'): UseAutoCategorizeResult {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PromptSuggestion | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const applyTags = useCallback(async (promptId: string, data: PromptSuggestion) => {
    await fetch(`/api/prompts/${promptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: data.tags,
        category: data.category,
        difficulty: data.difficulty,
      }),
    });
    setSuggestion(null);
  }, []);

  const suggestAndToast = useCallback(
    (promptId: string) => {
      setIsLoading(true);
      fetch(`/api/prompts/${promptId}/suggest`, { method: 'POST' })
        .then(async (res) => {
          if (!res.ok) return;
          const { data } = (await res.json()) as { data: PromptSuggestion };
          setSuggestion(data);

          const label =
            lang === 'pl'
              ? `${data.category} · ${data.difficulty} · ${data.tags.slice(0, 3).join(', ')}`
              : `${data.category} · ${data.difficulty} · ${data.tags.slice(0, 3).join(', ')}`;

          toast(lang === 'pl' ? 'AI zaproponował kategorie' : 'AI suggested categories', {
            description: label,
            duration: 15_000,
            action: {
              label: lang === 'pl' ? 'Akceptuj' : 'Accept',
              onClick: () => { void applyTags(promptId, data); },
            },
            cancel: {
              label: lang === 'pl' ? 'Edytuj' : 'Edit',
              onClick: () => setEditOpen(true),
            },
          });
        })
        .catch(() => {
          // silent — suggestions are non-critical
        })
        .finally(() => setIsLoading(false));
    },
    [lang, applyTags],
  );

  return { isLoading, suggestion, editOpen, setEditOpen, suggestAndToast, applyTags };
}
