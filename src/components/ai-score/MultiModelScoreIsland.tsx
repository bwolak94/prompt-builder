import React, { lazy, Suspense, useState, useCallback } from 'react';
import { Loader2, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIProvider } from '@/types';
import type { ModelScoreResult } from '@/pages/api/ai-score/multi';

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'done' | 'error';

interface DimensionRow {
  key: string;
  label: string;
  scores: Partial<Record<AIProvider, number>>;
}

// ── Radar chart (lazy) ────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<AIProvider, { stroke: string; fill: string }> = {
  openai:    { stroke: '#10b981', fill: '#10b981' },
  anthropic: { stroke: '#8b5cf6', fill: '#8b5cf6' },
};

const MultiRadarChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function Chart({ results }: { results: ModelScoreResult[] }) {
      const {
        RadarChart, Radar, PolarGrid, PolarAngleAxis,
        ResponsiveContainer, Tooltip, Legend,
      } = mod;

      const dimensions = ['clarity', 'specificity', 'structure', 'tone', 'completeness'];
      const labels: Record<string, string> = {
        clarity: 'Clarity', specificity: 'Specificity',
        structure: 'Structure', tone: 'Tone', completeness: 'Completeness',
      };

      const data = dimensions.map((dim) => {
        const entry: Record<string, unknown> = { subject: labels[dim] ?? dim };
        for (const r of results) {
          entry[r.provider] = r.score.dimensions[dim as keyof typeof r.score.dimensions]?.score ?? 0;
        }
        return entry;
      });

      const PROVIDER_LABELS: Record<AIProvider, string> = {
        openai: 'GPT-4o Mini',
        anthropic: 'Claude Haiku',
      };

      return (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
            {results.map((r) => {
              const c = PROVIDER_COLORS[r.provider];
              return (
                <Radar
                  key={r.provider}
                  name={PROVIDER_LABELS[r.provider]}
                  dataKey={r.provider}
                  stroke={c.stroke}
                  fill={c.fill}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              );
            })}
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b', border: '1px solid #27272a',
                borderRadius: '8px', fontSize: '12px', color: '#fafafa',
              }}
              formatter={(v: unknown) => [`${v}/100`] as [string]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      );
    },
  })),
);

// ── Comparison table ──────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  clarity: 'Clarity', specificity: 'Specificity',
  structure: 'Structure', tone: 'Tone', completeness: 'Completeness',
};

const ComparisonTable: React.FC<{ results: ModelScoreResult[]; isPl: boolean }> = ({
  results, isPl,
}) => {
  const PROVIDER_LABELS: Record<AIProvider, string> = {
    openai: 'GPT-4o Mini',
    anthropic: 'Claude Haiku',
  };

  const rows: DimensionRow[] = Object.keys(DIMENSION_LABELS).map((key) => ({
    key,
    label: DIMENSION_LABELS[key]!,
    scores: Object.fromEntries(
      results.map((r) => [
        r.provider,
        r.score.dimensions[key as keyof typeof r.score.dimensions]?.score ?? 0,
      ]),
    ) as Partial<Record<AIProvider, number>>,
  }));

  const getWinner = (row: DimensionRow): AIProvider | 'tie' | null => {
    const entries = results.map((r) => ({ p: r.provider, s: row.scores[r.provider] ?? 0 }));
    if (entries.length < 2) return null;
    const [a, b] = entries as [{ p: AIProvider; s: number }, { p: AIProvider; s: number }];
    if (Math.abs(a.s - b.s) <= 2) return 'tie';
    return a.s > b.s ? a.p : b.p;
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-raised text-text-muted">
            <th className="px-3 py-2 text-left font-medium">
              {isPl ? 'Wymiar' : 'Dimension'}
            </th>
            {results.map((r) => (
              <th key={r.provider} className="px-3 py-2 text-center font-medium">
                {PROVIDER_LABELS[r.provider]}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium">
              {isPl ? 'Lepszy' : 'Winner'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const winner = getWinner(row);
            return (
              <tr key={row.key} className="border-t border-border">
                <td className="px-3 py-2 text-text-secondary">{row.label}</td>
                {results.map((r) => {
                  const score = row.scores[r.provider] ?? 0;
                  const isWinner = winner === r.provider;
                  return (
                    <td
                      key={r.provider}
                      className={[
                        'px-3 py-2 text-center font-mono font-semibold',
                        isWinner ? 'text-green-400' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      {score}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  {winner === 'tie'
                    ? <span className="text-text-muted">{isPl ? 'Remis' : 'Tie'}</span>
                    : winner
                      ? <span className="text-[10px] font-medium text-green-400">
                          {PROVIDER_LABELS[winner]}
                        </span>
                      : '—'}
                </td>
              </tr>
            );
          })}
          {/* Overall row */}
          <tr className="border-t-2 border-border bg-surface-raised font-semibold">
            <td className="px-3 py-2 text-text-primary">
              {isPl ? 'Ogółem' : 'Overall'}
            </td>
            {results.map((r) => (
              <td key={r.provider} className="px-3 py-2 text-center font-mono text-brand-400">
                {r.score.overall}
              </td>
            ))}
            <td className="px-3 py-2 text-center">
              {results.length >= 2 && (() => {
                const [a, b] = results as [ModelScoreResult, ModelScoreResult];
                if (Math.abs(a.score.overall - b.score.overall) <= 2) {
                  return <span className="text-text-muted">{isPl ? 'Remis' : 'Tie'}</span>;
                }
                const winner = a.score.overall > b.score.overall ? a.provider : b.provider;
                return (
                  <span className="text-[10px] font-medium text-green-400">
                    {PROVIDER_LABELS[winner]}
                  </span>
                );
              })()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ── Main island ───────────────────────────────────────────────────────────────

interface MultiModelScoreIslandProps {
  promptId: string;
  content: string;
  isPl?: boolean;
}

export const MultiModelScoreIsland: React.FC<MultiModelScoreIslandProps> = ({
  promptId, content, isPl = true,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<ModelScoreResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>(['openai', 'anthropic']);

  const PROVIDER_LABELS: Record<AIProvider, string> = {
    openai: 'GPT-4o Mini (OpenAI)',
    anthropic: 'Claude Haiku (Anthropic)',
  };

  const toggleProvider = useCallback((p: AIProvider) => {
    setSelectedProviders((prev) =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter((x) => x !== p) : prev
        : [...prev, p],
    );
  }, []);

  const handleScore = useCallback(async () => {
    setStatus('loading');
    setResults([]);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai-score/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, content, providers: selectedProviders }),
      });
      const json = (await res.json()) as {
        data?: { results: ModelScoreResult[]; usageRemaining: number };
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (json.code === 'MULTI_SCORE_LIMIT') {
          setErrorMsg(isPl
            ? 'Miesięczny limit multi-score wyczerpany (10/miesiąc)'
            : 'Monthly multi-model scoring limit reached (10/month)');
        } else {
          setErrorMsg(json.error ?? (isPl ? 'Błąd oceniania' : 'Scoring failed'));
        }
        setStatus('error');
        return;
      }

      setResults(json.data!.results);
      setUsageRemaining(json.data!.usageRemaining);
      setStatus('done');
    } catch {
      setErrorMsg(isPl ? 'Błąd połączenia' : 'Connection error');
      setStatus('error');
    }
  }, [promptId, content, selectedProviders, isPl]);

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-400" />
          <p className="text-sm font-semibold text-text-primary">
            {isPl ? 'Porównanie modeli' : 'Multi-Model Scoring'}
          </p>
          {usageRemaining !== null && (
            <span className="ml-auto rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-text-muted">
              {usageRemaining} {isPl ? 'pozostało' : 'left this month'}
            </span>
          )}
        </div>

        <p className="text-xs text-text-muted">
          {isPl
            ? 'Oceń prompt jednocześnie przez GPT-4o i Claude, porównaj wyniki na wykresie radarowym.'
            : 'Score your prompt with GPT-4o and Claude simultaneously, compare results on a radar chart.'}
        </p>

        {/* Provider checkboxes */}
        <div className="flex gap-3">
          {(['openai', 'anthropic'] as AIProvider[]).map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={selectedProviders.includes(p)}
                onChange={() => toggleProvider(p)}
                className="accent-brand-500"
              />
              {PROVIDER_LABELS[p]}
            </label>
          ))}
        </div>

        {status === 'error' && errorMsg && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{errorMsg}</p>
        )}

        <Button
          size="sm"
          onClick={handleScore}
          disabled={selectedProviders.length === 0}
          className="gap-1.5 self-start"
        >
          <BarChart3 size={14} />
          {isPl ? 'Porównaj modele' : 'Compare models'}
        </Button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-5">
        <Loader2 size={18} className="animate-spin text-brand-400" />
        <p className="text-sm text-text-muted">
          {isPl
            ? `Ocenianie przez ${selectedProviders.length} model${selectedProviders.length > 1 ? 'e' : ''}…`
            : `Scoring with ${selectedProviders.length} model${selectedProviders.length > 1 ? 's' : ''}…`}
        </p>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {isPl ? 'Porównanie modeli' : 'Model Comparison'}
        </p>
        <div className="flex items-center gap-2">
          {usageRemaining !== null && (
            <span className="text-[10px] text-text-muted">
              {usageRemaining} {isPl ? 'pozostało' : 'remaining'}
            </span>
          )}
          <button
            onClick={handleScore}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
            aria-label={isPl ? 'Oceń ponownie' : 'Re-score'}
          >
            <RefreshCw size={11} />
            {isPl ? 'Ponów' : 'Re-score'}
          </button>
        </div>
      </div>

      {/* Radar chart */}
      <Suspense fallback={<div className="h-[260px] animate-pulse rounded-lg bg-surface-overlay" />}>
        <MultiRadarChart results={results} />
      </Suspense>

      {/* Comparison table */}
      <ComparisonTable results={results} isPl={isPl} />
    </div>
  );
};

export default MultiModelScoreIsland;
