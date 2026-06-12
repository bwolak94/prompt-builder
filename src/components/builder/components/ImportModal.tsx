import React, { useState, useId, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Sparkles, Wand2 } from 'lucide-react';
import { withIds } from '@/lib/services/import.service';
import type { ParsedImport, ImportedBlock } from '@/lib/services/import.service';
import type { PromptBlock } from '@/types';

// ── Section slug → display label ──────────────────────────────────────────────

const SLUG_LABELS: Record<string, string> = {
  role: 'Role',
  context: 'Context',
  task: 'Task',
  format: 'Format',
  constraints: 'Constraints',
  examples: 'Examples',
  tone: 'Tone',
  audience: 'Audience',
  chain_of_thought: 'Chain of Thought',
  output_schema: 'JSON Schema',
};

const SLUG_COLORS: Record<string, string> = {
  role: 'bg-purple-100 text-purple-700',
  context: 'bg-blue-100 text-blue-700',
  task: 'bg-green-100 text-green-700',
  format: 'bg-orange-100 text-orange-700',
  constraints: 'bg-red-100 text-red-700',
  examples: 'bg-yellow-100 text-yellow-700',
  tone: 'bg-pink-100 text-pink-700',
  audience: 'bg-teal-100 text-teal-700',
  chain_of_thought: 'bg-indigo-100 text-indigo-700',
  output_schema: 'bg-gray-100 text-gray-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const BlockPreview: React.FC<{ block: ImportedBlock; index: number }> = ({ block, index }) => {
  const label = SLUG_LABELS[block.section_slug] ?? block.section_slug;
  const color = SLUG_COLORS[block.section_slug] ?? 'bg-gray-100 text-gray-700';
  return (
    <div className="border-border bg-surface-raised rounded-lg border p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-text-muted text-xs">{index + 1}.</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>
      </div>
      <p className="text-text-secondary line-clamp-4 text-xs whitespace-pre-wrap">
        {block.content}
      </p>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────

type ParseMode = 'heuristic' | 'ai';
type Step = 'input' | 'preview';

interface ImportModalProps {
  open: boolean;
  lang: 'pl' | 'en';
  onImport: (title: string, blocks: PromptBlock[]) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ open, lang, onImport, onClose }) => {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ParseMode>('heuristic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const textareaId = useId();

  const isPl = lang === 'pl';

  const handleReset = useCallback(() => {
    setStep('input');
    setParsed(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    setText('');
    onClose();
  }, [handleReset, onClose]);

  const handleParse = useCallback(async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), mode }),
      });

      const json = (await res.json()) as { data?: ParsedImport; error?: string };

      if (!res.ok || json.error) {
        setError(json.error ?? (isPl ? 'Nie udało się sparsować' : 'Parse failed'));
        return;
      }

      if (json.data) {
        setParsed(json.data);
        setStep('preview');
      }
    } catch {
      setError(isPl ? 'Błąd połączenia' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [text, mode, isPl]);

  const handleImport = useCallback(() => {
    if (!parsed) return;
    const blocksWithIds = withIds(parsed.blocks) as PromptBlock[];
    onImport(parsed.title, blocksWithIds);
    handleClose();
  }, [parsed, onImport, handleClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'input'
              ? isPl
                ? 'Importuj prompt'
                : 'Import prompt'
              : isPl
                ? 'Podgląd sekcji'
                : 'Section preview'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? isPl
                ? 'Wklej prompt z ChatGPT, Claude lub innego narzędzia AI'
                : 'Paste a prompt from ChatGPT, Claude, or another AI tool'
              : isPl
                ? 'Sprawdź jak prompt zostanie podzielony na sekcje'
                : 'Review how your prompt will be split into sections'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="flex flex-col gap-4">
            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">
                {isPl ? 'Tryb parsowania:' : 'Parse mode:'}
              </span>
              <div className="border-border flex overflow-hidden rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setMode('heuristic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    mode === 'heuristic'
                      ? 'bg-brand-500 text-white'
                      : 'text-text-secondary hover:bg-surface-raised'
                  }`}
                >
                  <Wand2 size={12} />
                  {isPl ? 'Szybki' : 'Fast'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className={`border-border flex items-center gap-1.5 border-l px-3 py-1.5 transition-colors ${
                    mode === 'ai'
                      ? 'bg-brand-500 text-white'
                      : 'text-text-secondary hover:bg-surface-raised'
                  }`}
                >
                  <Sparkles size={12} />
                  {isPl ? 'AI (dokładniejszy)' : 'AI (accurate)'}
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={textareaId} className="sr-only">
                {isPl ? 'Tekst promptu' : 'Prompt text'}
              </label>
              <Textarea
                id={textareaId}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isPl ? 'Wklej tutaj swój prompt…' : 'Paste your prompt here…'}
                className="min-h-[200px] resize-none font-mono text-xs"
              />
              <span className="text-text-muted text-right text-xs">
                {text.length.toLocaleString()} {isPl ? 'znaków' : 'chars'}
              </span>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {isPl ? 'Anuluj' : 'Cancel'}
              </Button>
              <Button onClick={handleParse} disabled={!text.trim() || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {isPl ? 'Parsowanie…' : 'Parsing…'}
                  </>
                ) : isPl ? (
                  'Parsuj'
                ) : (
                  'Parse'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Parsed title */}
            <div className="bg-surface-raised flex items-center gap-2 rounded-md px-3 py-2">
              <span className="text-text-muted text-xs">{isPl ? 'Tytuł:' : 'Title:'}</span>
              <span className="text-text-primary text-xs font-medium">{parsed?.title}</span>
            </div>

            {/* Blocks preview */}
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
              {parsed?.blocks.map((block, i) => (
                <BlockPreview key={i} block={block} index={i} />
              ))}
            </div>

            {parsed && parsed.blocks.length === 0 && (
              <p className="text-text-muted text-center text-sm">
                {isPl ? 'Nie wykryto żadnych sekcji' : 'No sections detected'}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset} className="gap-1.5">
                <ArrowLeft size={14} />
                {isPl ? 'Wróć' : 'Back'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {isPl ? 'Anuluj' : 'Cancel'}
                </Button>
                <Button onClick={handleImport} disabled={!parsed?.blocks.length}>
                  {isPl ? 'Importuj do buildera' : 'Import to builder'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
