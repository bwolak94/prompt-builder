import React, { useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { useBuilderStore } from '../store/builder.store';
import type { PromptSection, SectionCategory } from '@/types';

interface SectionPaletteProps {
  sections: PromptSection[];
}

const CATEGORY_LABELS: Record<SectionCategory, string> = {
  core: 'Rdzeń',
  optional: 'Opcjonalne',
  advanced: 'Zaawansowane',
};

const CATEGORY_ORDER: SectionCategory[] = ['core', 'optional', 'advanced'];

export const SectionPalette: React.FC<SectionPaletteProps> = React.memo(({ sections }) => {
  const blocks = useBuilderStore((s) => s.blocks);
  const addBlock = useBuilderStore((s) => s.addBlock);

  const addedSlugs = new Set(blocks.map((b) => b.section_slug));

  const handleAdd = useCallback((slug: string) => {
    addBlock(slug);
  }, [addBlock]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: sections.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Sekcje
      </p>
      {grouped.map(({ category, label, items }) => (
        <Collapsible key={category} defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-1 hover:text-text-primary [&[data-state=open]>svg]:rotate-0">
            {label}
            <ChevronDown
              size={12}
              className="-rotate-90 text-text-muted transition-transform duration-200"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-1.5 pt-1 pl-1">
              {items.map((section) => (
                <SectionCard
                  key={section.slug}
                  section={section}
                  isAdded={addedSlugs.has(section.slug)}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
});
SectionPalette.displayName = 'SectionPalette';
