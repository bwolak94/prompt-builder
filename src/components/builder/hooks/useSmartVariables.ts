import { useState, useCallback, useMemo } from 'react';
import { parseSmartVariables, type SmartVariable } from '@/lib/variables/parser';
import { substituteSmartVariables } from '@/lib/variables/substitutor';
import { validateVariableValues, type VariableValidationError } from '@/lib/variables/validator';
import type { PromptBlock } from '@/types';

interface UseSmartVariablesReturn {
  variables: SmartVariable[];
  values: Record<string, string>;
  setValue: (name: string, value: string) => void;
  resetToDefaults: () => void;
  resolvedContent: string;
  validationErrors: VariableValidationError[];
}

export function useSmartVariables(
  blocks: PromptBlock[],
  rawContent: string,
): UseSmartVariablesReturn {
  const variables = useMemo(() => parseSmartVariables(blocks), [blocks]);

  const defaultValues = useMemo(
    () =>
      Object.fromEntries(variables.map((v) => [v.name, v.defaultValue])),
    [variables],
  );

  const [values, setValues] = useState<Record<string, string>>(defaultValues);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  const resolvedContent = useMemo(
    () => substituteSmartVariables(rawContent, values),
    [rawContent, values],
  );

  const validationErrors = useMemo(
    () => validateVariableValues(variables, values),
    [variables, values],
  );

  return { variables, values, setValue, resetToDefaults, resolvedContent, validationErrors };
}
