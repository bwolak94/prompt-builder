import React, { useId } from 'react';
import { ArrowLeft, Save, Globe, Lock, Loader2, Upload, Wand2, Zap } from 'lucide-react';
import { useBuilderStore } from '../store/builder.store';
import type { Lang } from '@/lib/i18n';

interface BuilderToolbarProps {
  onBack?: () => void;
  onSave?: () => Promise<void>;
  onImport?: () => void;
  onImproveAll?: () => void;
  onOptimize?: () => void;
  lang?: Lang;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  onBack, onSave, onImport, onImproveAll, onOptimize, lang = 'pl',
}) => {
  const isPl = lang === 'pl';
  const titleId = useId();

  const title = useBuilderStore((s) => s.title);
  const isPublic = useBuilderStore((s) => s.isPublic);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const setTitle = useBuilderStore((s) => s.setTitle);
  const setIsPublic = useBuilderStore((s) => s.setIsPublic);
  const save = useBuilderStore((s) => s.save);

  const handleSave = onSave ?? (async () => { try { await save(); } catch {} });

  return (
    <div className="flex h-14 items-center gap-3 border-b border-border bg-surface-base px-4">
      {/* Back button */}
      <button
        onClick={onBack ?? (() => history.back())}
        aria-label="Wróć"
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Title inline edit */}
      <label htmlFor={titleId} className="sr-only">Tytuł promptu</label>
      <input
        id={titleId}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł promptu…"
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      {/* Public / private toggle */}
      <button
        onClick={() => setIsPublic(!isPublic)}
        aria-label={isPublic ? 'Publiczny — kliknij aby zmienić na prywatny' : 'Prywatny — kliknij aby upublicznić'}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-surface-raised"
      >
        {isPublic ? (
          <Globe size={14} className="text-brand-400" />
        ) : (
          <Lock size={14} className="text-text-muted" />
        )}
        <span className={isPublic ? 'text-brand-400' : 'text-text-muted'}>
          {isPublic ? 'Publiczny' : 'Prywatny'}
        </span>
      </button>

      {/* Token optimizer button */}
      {onOptimize && (
        <button
          onClick={onOptimize}
          aria-label={isPl ? 'Optymalizuj tokeny' : 'Optimize tokens'}
          title={isPl ? 'Optymalizator tokenów' : 'Token Optimizer'}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <Zap size={14} className="text-amber-400" />
          <span className="hidden sm:inline">{isPl ? 'Tokeny' : 'Tokens'}</span>
        </button>
      )}

      {/* Improve All button */}
      {onImproveAll && (
        <button
          onClick={onImproveAll}
          aria-label={isPl ? 'Ulepsz cały prompt' : 'Improve full prompt'}
          title={isPl ? 'Ulepsz z AI' : 'AI Improve'}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <Wand2 size={14} className="text-brand-400" />
          <span className="hidden sm:inline">{isPl ? 'Ulepsz' : 'Improve'}</span>
        </button>
      )}

      {/* Import button */}
      {onImport && (
        <button
          onClick={onImport}
          aria-label="Import prompt"
          title="Import prompt"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Import</span>
        </button>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !isDirty}
        aria-label="Zapisz prompt"
        className="relative flex items-center gap-2 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        Zapisz
        {/* Dirty indicator dot */}
        {isDirty && !isSaving && (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
};
