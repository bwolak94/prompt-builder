import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateCategory, TemplateDifficulty } from '@/types';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'coding', label: 'Kod' },
  { value: 'writing', label: 'Pisanie' },
  { value: 'analysis', label: 'Analiza' },
  { value: 'roleplay', label: 'Roleplay' },
];

const DIFFICULTIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Wszystkie poziomy' },
  { value: 'beginner', label: 'Początkujący' },
  { value: 'intermediate', label: 'Średniozaawansowany' },
  { value: 'advanced', label: 'Zaawansowany' },
];

interface FilterPanelProps {
  category: string;
  difficulty: string;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  category,
  difficulty,
  onCategoryChange,
  onDifficultyChange,
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <Tabs value={category} onValueChange={onCategoryChange}>
      <TabsList className="h-8">
        {CATEGORIES.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} className="text-xs px-3 py-1 h-7">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <Select value={difficulty} onValueChange={onDifficultyChange}>
      <SelectTrigger className="w-[200px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DIFFICULTIES.map(({ value, label }) => (
          <SelectItem key={value} value={value} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
