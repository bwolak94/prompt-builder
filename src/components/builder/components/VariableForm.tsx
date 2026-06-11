import React, { useId, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBuilderStore } from '../store/builder.store';

function formatLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const VariableInput: React.FC<{ name: string; value: string; onChange: (v: string) => void }> = ({
  name,
  value,
  onChange,
}) => {
  const inputId = useId();
  const label = formatLabel(name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-1 py-1.5">
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={name}
          className="rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
        />
      </div>
    </motion.div>
  );
};

export const VariableForm: React.FC = () => {
  const detectedVariables = useBuilderStore((s) => s.detectedVariables);
  const variables = useBuilderStore((s) => s.variables);
  const setVariable = useBuilderStore((s) => s.setVariable);

  const handleChange = useCallback(
    (name: string, value: string) => {
      setVariable(name, value);
    },
    [setVariable],
  );

  if (detectedVariables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-text-muted">
          Użyj{' '}
          <code className="rounded bg-surface-1 px-1 text-amber-400">{'{{nazwa_zmiennej}}'}</code>{' '}
          w treści bloku aby dodać zmienną
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Zmienne</p>
      <AnimatePresence initial={false}>
        {detectedVariables.map(({ name }) => (
          <VariableInput
            key={name}
            name={name}
            value={variables[name] ?? ''}
            onChange={(v) => handleChange(name, v)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
