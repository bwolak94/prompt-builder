import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Check } from 'lucide-react';
import type { ImproveVariant, ImproveVariantId } from '@/lib/services/auto-improve.service';
import type { Lang } from '@/lib/i18n';

// ── Labels & colors ───────────────────────────────────────────────────────────

const VARIANT_META: Record<ImproveVariantId, { color: string; dotColor: string }> = {
  concise: { color: 'border-blue-500/40 bg-blue-500/5', dotColor: 'bg-blue-400' },
  precise: { color: 'border-green-500/40 bg-green-500/5', dotColor: 'bg-green-400' },
  structured: { color: 'border-amber-500/40 bg-amber-500/5', dotColor: 'bg-amber-400' },
};

const VARIANT_SELECTED: Record<ImproveVariantId, string> = {
  concise: 'ring-2 ring-blue-500',
  precise: 'ring-2 ring-green-500',
  structured: 'ring-2 ring-amber-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const VariantCard: React.FC<{
  variant: ImproveVariant;
  selected: boolean;
  onSelect: () => void;
}> = ({ variant, selected, onSelect }) => {
  const meta = VARIANT_META[variant.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-xl border p-4 text-left transition-all',
        meta.color,
        selected ? VARIANT_SELECTED[variant.id] : 'hover:ring-border hover:ring-1',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} aria-hidden />
        <span className="text-text-primary text-xs font-semibold">{variant.label}</span>
        {selected && <Check size={12} className="text-text-primary ml-auto" />}
      </div>
      <p className="text-text-secondary mb-2 line-clamp-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
        {variant.content}
      </p>
      <p className="text-text-muted text-[10px] italic">{variant.explanation}</p>
    </button>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────

interface ImproveModalProps {
  open: boolean;
  lang: Lang;
  /** 'block' = single block content, 'full' = entire prompt markdown */
  mode: 'block' | 'full';
  content: string;
  sectionSlug?: string;
  onApply: (content: string) => void;
  onClose: () => void;
}

export const ImproveModal: React.FC<ImproveModalProps> = ({
  open,
  lang,
  mode,
  content,
  sectionSlug,
  onApply,
  onClose,
}) => {
  const isPl = lang === 'pl';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ImproveVariant[]>([]);
  const [selectedId, setSelectedId] = useState<ImproveVariantId | null>(null);

  const handleClose = useCallback(() => {
    setVariants([]);
    setSelectedId(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Auto-fetch when opened
  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setVariants([]);
    setSelectedId(null);

    try {
      const res = await fetch('/api/prompts/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sectionSlug, mode }),
      });
      const json = (await res.json()) as { data?: { variants: ImproveVariant[] }; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? (isPl ? 'Nie udało się ulepszyć' : 'Improve failed'));
        return;
      }
      const v = json.data?.variants ?? [];
      setVariants(v);
      if (v.length > 0) setSelectedId(v[0]?.id ?? null);
    } catch {
      setError(isPl ? 'Błąd połączenia' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [content, sectionSlug, mode, isPl]);

  // Trigger fetch when dialog opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        void handleFetch();
      } else {
        handleClose();
      }
    },
    [handleFetch, handleClose],
  );

  const handleApply = useCallback(() => {
    const selected = variants.find((v) => v.id === selectedId);
    if (!selected) return;
    onApply(selected.content);
    handleClose();
  }, [variants, selectedId, onApply, handleClose]);

  const title =
    mode === 'full'
      ? isPl
        ? 'Ulepsz cały prompt'
        : 'Improve full prompt'
      : isPl
        ? 'Ulepsz blok'
        : 'Improve block';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 size={16} className="text-brand-400" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isPl
              ? 'Wybierz jeden z trzech wariantów ulepszenia'
              : 'Choose one of three improved variants'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 size={24} className="text-brand-400 animate-spin" />
            <p className="text-text-muted text-sm">
              {isPl ? 'AI ulepsza prompt…' : 'AI is improving the prompt…'}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <Button variant="link" size="sm" onClick={handleFetch} className="ml-2 text-red-400">
              {isPl ? 'Spróbuj ponownie' : 'Retry'}
            </Button>
          </div>
        )}

        {!isLoading && variants.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {variants.map((v) => (
                <VariantCard
                  key={v.id}
                  variant={v}
                  selected={selectedId === v.id}
                  onSelect={() => setSelectedId(v.id)}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                {isPl ? 'Anuluj' : 'Cancel'}
              </Button>
              <Button onClick={handleApply} disabled={!selectedId}>
                {isPl ? 'Zastosuj' : 'Apply'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
