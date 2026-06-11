import { useEffect, useRef } from 'react';
import { VARIABLE_REGEX } from '@/lib/constants';
import { useBuilderStore } from '../store/builder.store';
import type { VariableDefinition } from '@/types';

/**
 * Scans all block contents for {{variable}} patterns on every blocks change.
 * - Deduplicates variable names
 * - Preserves existing user-typed variable values in the store
 * - Updates store.detectedVariables
 */
export function useVariableDetection(): void {
  const blocks = useBuilderStore((s) => s.blocks);
  const setDetectedVariables = useBuilderStore((s) => s.setDetectedVariables);

  // Use a ref to hold the current variables to avoid the effect depending on them
  const variablesRef = useRef(useBuilderStore.getState().variables);
  useEffect(() => {
    const unsub = useBuilderStore.subscribe((state) => {
      variablesRef.current = state.variables;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const seen = new Set<string>();
    const detected: VariableDefinition[] = [];
    const regex = new RegExp(VARIABLE_REGEX.source, 'g');

    for (const block of blocks) {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(block.content)) !== null) {
        const name = match[1];
        if (!seen.has(name)) {
          seen.add(name);
          detected.push({ name });
        }
      }
    }

    setDetectedVariables(detected);
  }, [blocks, setDetectedVariables]);
}
