import { useState, useCallback, useRef } from 'react';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

export type RunState = 'idle' | 'running' | 'done' | 'error';

export interface RunConfig {
  provider: RunProviderName;
  model: string;
  useByok: boolean;
}

export interface UseRunPromptReturn {
  state: RunState;
  output: string;
  error: string | null;
  creditsRemaining: number | null;
  run: (promptText: string, config: RunConfig) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useRunPrompt(): UseRunPromptReturn {
  const [state, setState] = useState<RunState>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState('idle');
    setOutput('');
    setError(null);
  }, []);

  const run = useCallback(async (promptText: string, config: RunConfig) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('running');
    setOutput('');
    setError(null);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText,
          provider: config.provider,
          model: config.model,
          useByok: config.useByok,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();

          let event: { type: string; delta?: string; error?: string; creditsRemaining?: number };
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          if (event.type === 'delta' && event.delta) {
            setOutput((prev) => prev + event.delta);
          } else if (event.type === 'credits' && event.creditsRemaining !== undefined) {
            setCreditsRemaining(event.creditsRemaining);
          } else if (event.type === 'error') {
            throw new Error(event.error ?? 'Run failed');
          } else if (event.type === 'done') {
            setState('done');
          }
        }
      }

      setState('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState('idle');
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }, []);

  return { state, output, error, creditsRemaining, run, cancel, reset };
}
