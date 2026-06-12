import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, TrendingDown } from 'lucide-react';
import {
  countTokens,
  costPer1kCalls,
  MODEL_PRICING,
  type OptimizeMode,
  type OptimizeResult,
} from '@/lib/services/token-optimizer.service';
import type { Lang } from '@/lib/i18n';

// ── Sub-components ────────────────────────────────────────────────────────────

const PricingTable: React.FC<{
  originalTokens: number;
  optimizedTokens: number;
  isPl: boolean;
}> = ({ originalTokens, optimizedTokens, isPl }) => (
  <div className="border-border overflow-hidden rounded-xl border">
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-surface-raised text-text-muted">
          <th className="px-3 py-2 text-left font-medium">{isPl ? 'Model' : 'Model'}</th>
          <th className="px-3 py-2 text-right font-medium">
            {isPl ? 'Przed ($/1k)' : 'Before ($/1k)'}
          </th>
          <th className="px-3 py-2 text-right font-medium">
            {isPl ? 'Po ($/1k)' : 'After ($/1k)'}
          </th>
          <th className="px-3 py-2 text-right font-medium">{isPl ? 'Oszczędność' : 'Savings'}</th>
        </tr>
      </thead>
      <tbody>
        {MODEL_PRICING.map((m) => {
          const before = costPer1kCalls(originalTokens, m.inputCostPerMillion);
          const after = costPer1kCalls(optimizedTokens, m.inputCostPerMillion);
          const saved = before - after;
          return (
            <tr key={m.model} className="border-border border-t">
              <td className="text-text-secondary px-3 py-2 font-mono">{m.label}</td>
              <td className="text-text-secondary px-3 py-2 text-right">${before.toFixed(3)}</td>
              <td className="px-3 py-2 text-right text-green-400">${after.toFixed(3)}</td>
              <td className="px-3 py-2 text-right font-semibold text-green-400">
                {saved > 0 ? `-$${saved.toFixed(3)}` : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Main modal ────────────────────────────────────────────────────────────────

interface TokenOptimizerModalProps {
  open: boolean;
  lang: Lang;
  content: string;
  onApply: (optimized: string) => void;
  onClose: () => void;
}

export const TokenOptimizerModal: React.FC<TokenOptimizerModalProps> = ({
  open,
  lang,
  content,
  onApply,
  onClose,
}) => {
  const isPl = lang === 'pl';
  const [mode, setMode] = useState<OptimizeMode>('conservative');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResult | null>(null);

  const originalTokens = countTokens(content);

  const handleClose = useCallback(() => {
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleOptimize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/prompts/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mode }),
      });
      const json = (await res.json()) as { data?: OptimizeResult; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? (isPl ? 'Optymalizacja nie powiodła się' : 'Optimization failed'));
        return;
      }
      setResult(json.data ?? null);
    } catch {
      setError(isPl ? 'Błąd połączenia' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [content, mode, isPl]);

  const handleApply = useCallback(() => {
    if (!result) return;
    onApply(result.optimized);
    handleClose();
  }, [result, onApply, handleClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            {isPl ? 'Optymalizator tokenów' : 'Token Optimizer'}
          </DialogTitle>
          <DialogDescription>
            {isPl
              ? 'Zmniejsz liczbę tokenów i obniż koszty API bez utraty jakości'
              : 'Reduce token count and API costs without losing quality'}
          </DialogDescription>
        </DialogHeader>

        {/* Mode selector */}
        <div className="flex gap-2">
          {(['conservative', 'aggressive'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setResult(null);
              }}
              className={[
                'flex-1 rounded-xl border p-3 text-left transition-all',
                mode === m
                  ? 'border-brand-500/60 bg-brand-500/10 ring-brand-500 ring-1'
                  : 'border-border hover:border-border-active',
              ].join(' ')}
            >
              <p className="text-text-primary text-xs font-semibold">
                {m === 'conservative'
                  ? isPl
                    ? 'Konserwatywna'
                    : 'Conservative'
                  : isPl
                    ? 'Agresywna'
                    : 'Aggressive'}
              </p>
              <p className="text-text-muted mt-0.5 text-[10px]">
                {m === 'conservative'
                  ? isPl
                    ? '~20% mniej tokenów, pełna semantyka'
                    : '~20% fewer tokens, full semantics'
                  : isPl
                    ? '~40% mniej tokenów, może zmienić brzmienie'
                    : '~40% fewer tokens, may rephrase'}
              </p>
            </button>
          ))}
        </div>

        {/* Original token stats */}
        <div className="bg-surface-raised flex items-center gap-3 rounded-lg px-4 py-2.5">
          <span className="text-text-muted text-xs">{isPl ? 'Oryginał:' : 'Original:'}</span>
          <span className="text-text-primary font-mono text-sm font-semibold">
            {originalTokens.toLocaleString()} {isPl ? 'tokenów' : 'tokens'}
          </span>
          <span className="text-text-muted ml-auto text-xs">
            ≈ {content.length.toLocaleString()} {isPl ? 'znaków' : 'chars'}
          </span>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-6 text-center">
            <Loader2 size={20} className="text-brand-400 animate-spin" />
            <span className="text-text-muted text-sm">
              {isPl ? 'Optymalizowanie…' : 'Optimizing…'}
            </span>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4">
            {/* Savings badge */}
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2.5">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                {isPl ? 'Zaoszczędzono' : 'Saved'}{' '}
                {(result.originalTokens - result.optimizedTokens).toLocaleString()}{' '}
                {isPl ? 'tokenów' : 'tokens'} ({result.savedPercent}%)
              </span>
              <span className="ml-auto font-mono text-xs text-green-400">
                {result.optimizedTokens.toLocaleString()} {isPl ? 'tokenów' : 'tokens'}
              </span>
            </div>

            {/* Explanation */}
            <p className="text-text-muted text-xs italic">{result.explanation}</p>

            {/* Optimized preview */}
            <div className="border-border bg-surface-base max-h-40 overflow-y-auto rounded-lg border p-3">
              <p className="text-text-secondary font-mono text-xs whitespace-pre-wrap">
                {result.optimized}
              </p>
            </div>

            {/* Pricing table */}
            <PricingTable
              originalTokens={result.originalTokens}
              optimizedTokens={result.optimizedTokens}
              isPl={isPl}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleOptimize}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {result
              ? isPl
                ? 'Optymalizuj ponownie'
                : 'Re-optimize'
              : isPl
                ? 'Optymalizuj'
                : 'Optimize'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {isPl ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button onClick={handleApply} disabled={!result}>
              {isPl ? 'Zastosuj' : 'Apply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
