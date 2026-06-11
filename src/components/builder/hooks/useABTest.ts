import { useState, useCallback, useMemo, useRef } from 'react';
import { computeDiff, type LineDiff } from '@/lib/diff';
import type { ABTest, ABVariant } from '@/db/repositories/ab-test.repo';
import type { PromptBlock, ScoreResult, AIProvider } from '@/types';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

export type ABStatus = 'idle' | 'creating' | 'scoring' | 'running' | 'ready' | 'error';

interface UseABTestReturn {
  // State
  test: ABTest | null;
  status: ABStatus;
  error: string | null;
  variantBBlocks: PromptBlock[];
  variantBContentMd: string;
  responseA: string;
  responseB: string;
  scoreA: ScoreResult | null;
  scoreB: ScoreResult | null;
  diff: LineDiff[];
  isRunning: boolean;
  isScoring: boolean;

  // Actions
  createTest: (promptId: string) => Promise<void>;
  updateVariantB: (blocks: PromptBlock[], contentMd: string) => void;
  saveVariantB: () => Promise<void>;
  scoreOffline: (provider?: AIProvider) => Promise<void>;
  runLive: (provider: RunProviderName, model: string, useByok?: boolean) => Promise<void>;
  cancelRun: () => void;
  applyWinner: (winner: 'a' | 'b' | 'tie', applyToPrompt?: boolean) => Promise<ABTest>;
  exitABMode: () => void;
}

export function useABTest(): UseABTestReturn {
  const [test, setTest] = useState<ABTest | null>(null);
  const [status, setStatus] = useState<ABStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [variantBBlocks, setVariantBBlocks] = useState<PromptBlock[]>([]);
  const [variantBContentMd, setVariantBContentMd] = useState('');
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [scoreA, setScoreA] = useState<ScoreResult | null>(null);
  const [scoreB, setScoreB] = useState<ScoreResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Diff computed from variant A vs current variant B content
  const diff = useMemo(
    () => computeDiff(test?.variant_a.content_md ?? '', variantBContentMd),
    [test?.variant_a.content_md, variantBContentMd],
  );

  const createTest = useCallback(async (promptId: string) => {
    setStatus('creating');
    setError(null);
    try {
      const res = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to create A/B test');
      }
      const { data } = (await res.json()) as { data: ABTest };
      setTest(data);
      setVariantBBlocks(data.variant_b.blocks);
      setVariantBContentMd(data.variant_b.content_md);
      setScoreA(data.score_a);
      setScoreB(data.score_b);
      setResponseA(data.response_a ?? '');
      setResponseB(data.response_b ?? '');
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  const updateVariantB = useCallback((blocks: PromptBlock[], contentMd: string) => {
    setVariantBBlocks(blocks);
    setVariantBContentMd(contentMd);
  }, []);

  const saveVariantB = useCallback(async () => {
    if (!test) return;
    await fetch(`/api/ab-tests/${test.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variant_b: { blocks: variantBBlocks, content_md: variantBContentMd } satisfies ABVariant,
      }),
    });
  }, [test, variantBBlocks, variantBContentMd]);

  const scoreOffline = useCallback(async (provider: AIProvider = 'openai') => {
    if (!test) return;
    // Persist current variant B before scoring
    await saveVariantB();
    setStatus('scoring');
    setError(null);
    try {
      const res = await fetch(`/api/ab-tests/${test.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Scoring failed');
      }
      const { data } = (await res.json()) as { data: ABTest };
      setTest(data);
      setScoreA(data.score_a);
      setScoreB(data.score_b);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed');
      setStatus('error');
    }
  }, [test, saveVariantB]);

  const runLive = useCallback(async (
    provider: RunProviderName,
    model: string,
    useByok = false,
  ) => {
    if (!test) return;
    await saveVariantB();

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus('running');
    setResponseA('');
    setResponseB('');
    setError(null);

    try {
      const res = await fetch(`/api/ab-tests/${test.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, useByok }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Run failed');
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();

          let msg: { variant?: 'a' | 'b'; type: string; delta?: string; error?: string };
          try { msg = JSON.parse(raw); } catch { continue; }

          if (msg.type === 'done' && !msg.variant) {
            setStatus('ready');
            return;
          }
          if (msg.type === 'error') {
            setError(msg.error ?? 'Run error');
            setStatus('error');
            return;
          }
          if (msg.type === 'delta' && msg.delta) {
            if (msg.variant === 'a') setResponseA((prev) => prev + msg.delta!);
            if (msg.variant === 'b') setResponseB((prev) => prev + msg.delta!);
          }
        }
      }

      setStatus('ready');
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') {
        setStatus('ready');
        return;
      }
      setError(err instanceof Error ? err.message : 'Run failed');
      setStatus('error');
    }
  }, [test, saveVariantB]);

  const cancelRun = useCallback(() => {
    abortRef.current?.abort();
    setStatus('ready');
  }, []);

  const applyWinner = useCallback(async (
    winner: 'a' | 'b' | 'tie',
    applyToPrompt = false,
  ): Promise<ABTest> => {
    if (!test) throw new Error('No active A/B test');
    const res = await fetch(`/api/ab-tests/${test.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner, applyWinner: applyToPrompt }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? 'Failed to resolve test');
    }
    const { data } = (await res.json()) as { data: { test: ABTest } };
    setTest(data.test);
    return data.test;
  }, [test]);

  const exitABMode = useCallback(() => {
    abortRef.current?.abort();
    setTest(null);
    setStatus('idle');
    setError(null);
    setVariantBBlocks([]);
    setVariantBContentMd('');
    setResponseA('');
    setResponseB('');
    setScoreA(null);
    setScoreB(null);
  }, []);

  return {
    test,
    status,
    error,
    variantBBlocks,
    variantBContentMd,
    responseA,
    responseB,
    scoreA,
    scoreB,
    diff,
    isRunning: status === 'running',
    isScoring: status === 'scoring',
    createTest,
    updateVariantB,
    saveVariantB,
    scoreOffline,
    runLive,
    cancelRun,
    applyWinner,
    exitABMode,
  };
}
