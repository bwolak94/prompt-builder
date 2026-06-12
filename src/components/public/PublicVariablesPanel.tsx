/**
 * Public Variables Panel — F-04
 * Interactive smart-variable form for /p/[slug] (no login required).
 * Rendered as a React island (client:load).
 */

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SmartVariableField } from '@/components/builder/components/SmartVariableField';
import { useSmartVariables } from '@/components/builder/hooks/useSmartVariables';
import { blocksToMarkdown } from '@/lib/markdown';
import type { PromptBlock } from '@/types';

interface PublicVariablesPanelProps {
  blocks: PromptBlock[];
  contentMd: string;
}

export const PublicVariablesPanel: React.FC<PublicVariablesPanelProps> = ({
  blocks,
  contentMd,
}) => {
  const { variables, values, setValue, resetToDefaults, resolvedContent, validationErrors } =
    useSmartVariables(blocks, contentMd);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(resolvedContent);
  }, [resolvedContent]);

  if (variables.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Variable fields */}
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Zmienne</h2>
          <button
            onClick={resetToDefaults}
            className="text-[10px] text-text-muted transition-colors hover:text-text-primary"
          >
            Resetuj
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {variables.map((variable) => (
            <SmartVariableField
              key={variable.name}
              variable={variable}
              value={values[variable.name] ?? ''}
              onChange={(v) => setValue(variable.name, v)}
            />
          ))}
        </div>

        {validationErrors.length > 0 && (
          <ul className="mt-2 flex flex-col gap-0.5">
            {validationErrors.map((e) => (
              <li key={e.name} className="text-[10px] text-destructive">
                {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Live preview with substituted variables */}
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Podgląd z wartościami</h2>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => void handleCopy()}
          >
            Kopiuj
          </Button>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-secondary">
          {resolvedContent}
        </pre>
      </div>
    </div>
  );
};

export default PublicVariablesPanel;
