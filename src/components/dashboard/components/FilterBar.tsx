import React from 'react';

export type FilterValue = 'all' | 'public' | 'private' | 'unscored';

interface FilterBarProps {
  active: FilterValue;
  counts: { all: number; public: number; private: number; unscored: number };
  onChange: (filter: FilterValue) => void;
}

const TABS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'public', label: 'Publiczne' },
  { value: 'private', label: 'Prywatne' },
  { value: 'unscored', label: 'Bez oceny' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ active, counts, onChange }) => (
  <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Filtruj prompty">
    {TABS.map(({ value, label }) => (
      <button
        key={value}
        role="tab"
        aria-selected={active === value}
        onClick={() => onChange(value)}
        className={[
          'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          active === value
            ? 'border-brand-500 text-brand-400'
            : 'border-transparent text-text-muted hover:text-text-secondary',
        ].join(' ')}
      >
        {label}
        <span className="rounded-full bg-surface-overlay px-1.5 py-0.5 text-xs text-text-muted">
          {counts[value]}
        </span>
      </button>
    ))}
  </div>
);
