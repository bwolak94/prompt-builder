import React from 'react';
import { FileText, Globe, Lock, Star } from 'lucide-react';

export interface Stats {
  total: number;
  public: number;
  forks: number;
  avgScore: number | null;
}

interface StatsRowProps {
  stats: Stats;
}

const CARDS = [
  { key: 'total' as const, label: 'Wszystkie', Icon: FileText, color: 'text-brand-400' },
  { key: 'public' as const, label: 'Publiczne', Icon: Globe, color: 'text-emerald-400' },
  { key: 'forks' as const, label: 'Forki', Icon: Lock, color: 'text-amber-400' },
  { key: 'avgScore' as const, label: 'Śr. ocena AI', Icon: Star, color: 'text-violet-400' },
];

export const StatsRow: React.FC<StatsRowProps> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {CARDS.map(({ key, label, Icon, color }) => {
      const value = stats[key];
      const display = value === null ? '—' : key === 'avgScore' ? `${value}/100` : String(value);
      return (
        <div
          key={key}
          className="rounded-xl border border-border bg-surface-raised px-4 py-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon size={14} className={color} aria-hidden="true" />
            <span className="text-xs text-text-muted">{label}</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{display}</p>
        </div>
      );
    })}
  </div>
);
