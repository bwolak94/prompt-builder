import React, { useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(v), 300);
    },
    [onChange],
  );

  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Szukaj szablonów…"
        defaultValue={value}
        onChange={handleChange}
        className="pl-9 pr-9"
        aria-label="Szukaj szablonów"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
          aria-label="Wyczyść wyszukiwanie"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
