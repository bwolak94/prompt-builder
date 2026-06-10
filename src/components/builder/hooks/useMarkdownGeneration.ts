import { useMemo, useState, useEffect, useRef } from 'react';
import { blocksToMarkdown, substituteVariables } from '@/lib/markdown';
import { useBuilderStore } from '../store/builder.store';

const DEBOUNCE_MS = 150;

/**
 * Returns the final markdown string (blocks → md → variables substituted),
 * debounced by 150ms to avoid re-renders on every keystroke.
 */
export function useMarkdownGeneration(): string {
  const blocks = useBuilderStore((s) => s.blocks);
  const variables = useBuilderStore((s) => s.variables);

  const computed = useMemo(
    () => substituteVariables(blocksToMarkdown(blocks), variables),
    [blocks, variables],
  );

  const [debounced, setDebounced] = useState(computed);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(computed), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [computed]);

  return debounced;
}
