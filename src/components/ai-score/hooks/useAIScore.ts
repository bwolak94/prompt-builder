import { useState, useCallback, useRef } from 'react';
import type { ScoreResult, AIProvider } from '@/types';

type Status = 'idle' | 'loading' | 'streaming' | 'complete' | 'error';

interface UseAIScoreReturn {
  status: Status;
  score: ScoreResult | null;
  partialJson: string;
  error: string | null;
  trigger: (promptId: string, content: string, provider?: AIProvider) => void;
  reset: () => void;
}

export function useAIScore(): UseAIScoreReturn {
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [partialJson, setPartialJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setScore(null);
    setPartialJson('');
    setError(null);
  }, []);

  const trigger = useCallback(
    (promptId: string, content: string, provider: AIProvider = 'openai') => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setScore(null);
      setPartialJson('');
      setError(null);

      void (async () => {
        try {
          const res = await fetch('/api/ai-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptId, content, provider }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
          }

          if (!res.body) throw new Error('No response body');

          setStatus('streaming');

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            // Parse SSE lines
            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                setStatus('complete');
                break;
              }

              let parsed: { delta?: string; error?: string };
              try {
                parsed = JSON.parse(data);
              } catch {
                continue;
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.delta) {
                accumulated += parsed.delta;
                setPartialJson(accumulated);

                // Progressive parse: try to extract a valid score
                try {
                  const candidate = JSON.parse(accumulated);
                  if (candidate?.overall !== undefined) {
                    setScore(jsonToScoreResult(candidate, provider));
                  }
                } catch {
                  // Not yet valid JSON — keep accumulating
                }
              }
            }
          }

          // Final parse in case streaming finished without [DONE]
          if (accumulated) {
            try {
              const final = JSON.parse(accumulated);
              setScore(jsonToScoreResult(final, provider));
            } catch {}
          }

          setStatus((s) => (s === 'streaming' ? 'complete' : s));
        } catch (err) {
          if ((err as { name?: string }).name === 'AbortError') return;
          setError(err instanceof Error ? err.message : 'Scoring failed');
          setStatus('error');
        }
      })();
    },
    [],
  );

  return { status, score, partialJson, error, trigger, reset };
}

// ── Helper ────────────────────────────────────────────────────────────────────

function jsonToScoreResult(json: Record<string, unknown>, provider: AIProvider): ScoreResult {
  const dim = (json.dimensions as Record<string, { score: number; comment: string; suggestions: string[] }>) ?? {};
  return {
    overall_score: Number(json.overall ?? 0),
    scores: {
      clarity:      dim.clarity?.score      ?? 0,
      specificity:  dim.specificity?.score  ?? 0,
      structure:    dim.structure?.score    ?? 0,
      tone:         dim.tone?.score         ?? 0,
      completeness: dim.completeness?.score ?? 0,
    },
    feedback: {
      clarity:      { score: dim.clarity?.score ?? 0,      comment: dim.clarity?.comment ?? '',      suggestions: dim.clarity?.suggestions      ?? [] },
      specificity:  { score: dim.specificity?.score ?? 0,  comment: dim.specificity?.comment ?? '',  suggestions: dim.specificity?.suggestions  ?? [] },
      structure:    { score: dim.structure?.score ?? 0,    comment: dim.structure?.comment ?? '',    suggestions: dim.structure?.suggestions    ?? [] },
      tone:         { score: dim.tone?.score ?? 0,         comment: dim.tone?.comment ?? '',         suggestions: dim.tone?.suggestions         ?? [] },
      completeness: { score: dim.completeness?.score ?? 0, comment: dim.completeness?.comment ?? '', suggestions: dim.completeness?.suggestions ?? [] },
    },
    model_used: provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001',
    provider,
  };
}
