import { useEffect } from 'react';
import { parseSmartVariables } from '@/lib/variables/parser';
import { useBuilderStore } from '../store/builder.store';

/**
 * Scans all block contents for smart variable tokens on every blocks change.
 * Supports: {{name}}, {{name:text}}, {{name:select:...}}, {{name:number:...}},
 *           {{name:multiline}}, {{name:boolean}}
 * Updates store.detectedVariables with full SmartVariable metadata.
 */
export function useVariableDetection(): void {
  const blocks = useBuilderStore((s) => s.blocks);
  const setDetectedVariables = useBuilderStore((s) => s.setDetectedVariables);

  useEffect(() => {
    const detected = parseSmartVariables(blocks);
    // Store expects VariableDefinition[] (just { name }) — we store full SmartVariable
    // Cast is safe: SmartVariable has name + more fields
    setDetectedVariables(detected);
  }, [blocks, setDetectedVariables]);
}
