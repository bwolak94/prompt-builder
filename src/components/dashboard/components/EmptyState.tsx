import React from 'react';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  filter: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ filter }) => {
  const isFiltered = filter !== 'all';
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
      <FileText size={40} className="text-text-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text-primary">
          {isFiltered ? 'Brak promptów w tej kategorii' : 'Nie masz jeszcze żadnych promptów'}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {isFiltered
            ? 'Zmień filtr lub utwórz nowy prompt'
            : 'Zacznij od stworzenia swojego pierwszego promptu AI'}
        </p>
      </div>
      {!isFiltered && (
        <a
          href="/builder"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Stwórz pierwszy prompt
        </a>
      )}
    </div>
  );
};
