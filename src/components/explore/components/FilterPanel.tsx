import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n, type Lang } from '@/lib/i18n';

interface FilterPanelProps {
  category: string;
  difficulty: string;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  lang: Lang;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  category,
  difficulty,
  onCategoryChange,
  onDifficultyChange,
  lang,
}) => {
  const { t } = useI18n(lang);

  const categories = [
    { value: 'all', label: t('filters.allCategories') },
    { value: 'coding', label: t('filters.coding') },
    { value: 'writing', label: t('filters.writing') },
    { value: 'analysis', label: t('filters.analysis') },
    { value: 'roleplay', label: t('filters.roleplay') },
  ];

  const difficulties = [
    { value: 'all', label: t('filters.allDifficulties') },
    { value: 'beginner', label: t('filters.beginner') },
    { value: 'intermediate', label: t('filters.intermediate') },
    { value: 'advanced', label: t('filters.advanced') },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={category} onValueChange={onCategoryChange}>
        <TabsList className="h-8">
          {categories.map(({ value, label }) => (
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
          {difficulties.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
