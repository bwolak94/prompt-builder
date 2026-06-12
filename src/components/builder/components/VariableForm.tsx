import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBuilderStore } from '../store/builder.store';
import { SmartVariableField } from './SmartVariableField';

export const VariableForm: React.FC = () => {
  const detectedVariables = useBuilderStore((s) => s.detectedVariables);
  const variables = useBuilderStore((s) => s.variables);
  const setVariable = useBuilderStore((s) => s.setVariable);

  const handleChange = useCallback(
    (name: string, value: string) => setVariable(name, value),
    [setVariable],
  );

  if (detectedVariables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-text-muted">
          Użyj{' '}
          <code className="rounded bg-surface-1 px-1 text-amber-400">{'{{nazwa_zmiennej}}'}</code>{' '}
          w treści bloku aby dodać zmienną. Obsługiwane typy:{' '}
          <code className="text-amber-400">{'{{lang:select:PL,EN}}'}</code>
          {', '}
          <code className="text-amber-400">{'{{level:number:1:10}}'}</code>
          {', '}
          <code className="text-amber-400">{'{{tests:boolean}}'}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Zmienne</p>
      <AnimatePresence initial={false}>
        {detectedVariables.map((variable) => (
          <motion.div
            key={variable.name}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <SmartVariableField
              variable={variable}
              value={variables[variable.name] ?? ''}
              onChange={(v) => handleChange(variable.name, v)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
