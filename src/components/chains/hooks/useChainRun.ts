import { useState, useCallback, useRef } from 'react';
import type { LocalNode } from './useChainBuilder';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

export type NodeRunStatus = 'idle' | 'running' | 'done' | 'error';

export interface NodeRunState {
  status: NodeRunStatus;
  output: string;
  error: string | null;
}

interface UseChainRunResult {
  nodeStates: NodeRunState[];
  isRunning: boolean;
  runChain: (nodes: LocalNode[], opts: RunOptions) => Promise<void>;
  cancelRun: () => void;
  resetRun: () => void;
}

interface RunOptions {
  provider: RunProviderName;
  model: string;
  useByok: boolean;
}

function substituteVars(template: string, prevOutput: string): string {
  return template.replace(/\{\{prev_output\}\}/gi, prevOutput);
}

export function useChainRun(nodeCount: number): UseChainRunResult {
  const [nodeStates, setNodeStates] = useState<NodeRunState[]>(() =>
    Array.from({ length: nodeCount }, () => ({ status: 'idle', output: '', error: null })),
  );
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const resetRun = useCallback(() => {
    setNodeStates(Array.from({ length: nodeCount }, () => ({ status: 'idle', output: '', error: null })));
    setIsRunning(false);
  }, [nodeCount]);

  const cancelRun = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const setNodeState = useCallback(
    (index: number, updates: Partial<NodeRunState>) => {
      setNodeStates((prev) => {
        const next = [...prev];
        next[index] = { ...next[index]!, ...updates };
        return next;
      });
    },
    [],
  );

  const runSingle = useCallback(
    async (
      promptText: string,
      opts: RunOptions,
      nodeIndex: number,
      signal: AbortSignal,
    ): Promise<string> => {
      setNodeState(nodeIndex, { status: 'running', output: '', error: null });

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText,
          provider: opts.provider,
          model: opts.model,
          useByok: opts.useByok,
        }),
        signal,
      });

      if (!res.ok || !res.body) {
        const err = 'Run request failed';
        setNodeState(nodeIndex, { status: 'error', error: err });
        throw new Error(err);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              delta?: string;
              error?: string;
            };

            if (event.type === 'delta' && event.delta) {
              fullOutput += event.delta;
              setNodeState(nodeIndex, { output: fullOutput });
            } else if (event.type === 'done') {
              setNodeState(nodeIndex, { status: 'done', output: fullOutput });
            } else if (event.type === 'error') {
              const errMsg = event.error ?? 'Unknown error';
              setNodeState(nodeIndex, { status: 'error', error: errMsg });
              throw new Error(errMsg);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      return fullOutput;
    },
    [setNodeState],
  );

  const runChain = useCallback(
    async (nodes: LocalNode[], opts: RunOptions) => {
      if (isRunning) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      // Reset all nodes
      setNodeStates(
        Array.from({ length: nodes.length }, () => ({ status: 'idle', output: '', error: null })),
      );

      let prevOutput = '';

      try {
        for (let i = 0; i < nodes.length; i++) {
          if (controller.signal.aborted) break;

          const node = nodes[i]!;
          const promptText = substituteVars(node.content_md || node.title, prevOutput).trim();

          if (!promptText) {
            setNodeState(i, { status: 'done', output: '(empty node — skipped)' });
            continue;
          }

          prevOutput = await runSingle(promptText, opts, i, controller.signal);
        }
      } catch {
        // Individual node errors already set via setNodeState
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, runSingle, setNodeState],
  );

  return { nodeStates, isRunning, runChain, cancelRun, resetRun };
}
