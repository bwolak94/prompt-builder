import React, { lazy, Suspense } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useAIScore } from './hooks/useAIScore';
import { ScoreStreamLoader } from './components/ScoreStreamLoader';
import { ScoreRingProgress } from './components/ScoreRingProgress';
import { DimensionAccordion } from './components/DimensionAccordion';
import type { AIProvider } from '@/types';

const ScoreRadarChart = lazy(() =>
  import('./components/ScoreRadarChart').then((m) => ({ default: m.ScoreRadarChart })),
);

interface AIScoreIslandProps {
  promptId: string;
  content: string;
  provider?: AIProvider;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'GPT-4o mini',
  anthropic: 'Claude Haiku',
};

export const AIScoreIsland: React.FC<AIScoreIslandProps> = ({
  promptId,
  content,
  provider = 'openai',
}) => {
  const { status, score, error, trigger, reset } = useAIScore();

  const handleScore = () => trigger(promptId, content, provider);

  // ── Idle ──────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
        <Zap size={20} className="text-brand-400" />
        <div>
          <p className="text-sm font-medium text-text-primary">Oceń prompt AI</p>
          <p className="mt-0.5 text-xs text-text-muted">
            Ocenianie przez {PROVIDER_LABELS[provider]}
          </p>
        </div>
        <button
          onClick={handleScore}
          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Oceń prompt
        </button>
      </div>
    );
  }

  // ── Loading / streaming ────────────────────────────────────────
  if (status === 'loading' || (status === 'streaming' && !score)) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <ScoreStreamLoader />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-xs text-red-400">{error ?? 'Ocenianie nie powiodło się'}</p>
        <button
          onClick={() => { reset(); handleScore(); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          <RefreshCw size={12} /> Spróbuj ponownie
        </button>
      </div>
    );
  }

  // ── Streaming with partial score / Complete ────────────────────
  if (!score) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Ocena AI
        </p>
        <button
          onClick={() => { reset(); handleScore(); }}
          disabled={status === 'streaming'}
          aria-label="Oceń ponownie"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary disabled:opacity-40"
        >
          <RefreshCw size={11} className={status === 'streaming' ? 'animate-spin' : ''} />
          Oceń ponownie
        </button>
      </div>

      {/* Ring + provider badge */}
      <div className="flex flex-col items-center gap-2">
        <div aria-live="polite" aria-label={`Wynik ogólny: ${Math.round(score.overall_score)}`}>
          <ScoreRingProgress score={score.overall_score} label="Wynik ogólny" />
        </div>
        <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] text-brand-400">
          Ocenione przez {PROVIDER_LABELS[score.provider]}
        </span>
      </div>

      {/* Radar chart — lazy, visible on complete */}
      {status === 'complete' && (
        <Suspense fallback={<div className="h-[220px] animate-pulse rounded-lg bg-surface-overlay" />}>
          <ScoreRadarChart scores={score.scores} />
        </Suspense>
      )}

      {/* Dimension accordion */}
      <DimensionAccordion feedback={score.feedback} />
    </div>
  );
};

export default AIScoreIsland;
