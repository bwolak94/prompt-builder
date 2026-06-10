import React from 'react';
import { Check } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getSectionColors } from '@/lib/constants';
import { useDynamicIcon } from '../hooks/useDynamicIcon';
import type { PromptSection } from '@/types';

interface SectionCardProps {
  section: PromptSection;
  isAdded: boolean;
  onAdd: (slug: string) => void;
}

export const SectionCard: React.FC<SectionCardProps> = React.memo(({ section, isAdded, onAdd }) => {
  const colors = getSectionColors(section.slug);
  const Icon = useDynamicIcon(section.icon);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${section.slug}`,
    data: { type: 'palette', sectionSlug: section.slug },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={setNodeRef}
          onClick={() => onAdd(section.slug)}
          aria-label={`Dodaj sekcję: ${section.name}`}
          className={[
            'flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all',
            'cursor-grab active:cursor-grabbing',
            colors.bg,
            colors.border,
            isAdded ? 'opacity-40' : 'hover:opacity-80',
            isDragging ? 'opacity-50 shadow-lg' : '',
          ].join(' ')}
          {...listeners}
          {...attributes}
        >
          <span className={colors.text}>
            {Icon && <Icon size={14} />}
          </span>
          <span className={`flex-1 text-xs font-medium ${colors.text}`}>{section.name}</span>
          {isAdded && <Check size={12} className={colors.text} />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px] text-xs">
        {section.description}
      </TooltipContent>
    </Tooltip>
  );
});
SectionCard.displayName = 'SectionCard';
