import React, { useRef, useEffect, useCallback, useId } from 'react';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getSectionColors } from '@/lib/constants';
import { useBuilderStore } from '../store/builder.store';
import { useDynamicIcon } from '../hooks/useDynamicIcon';
import { PromptBlockOverlay } from './PromptBlockOverlay';
import type { PromptBlock as PromptBlockType, PromptSection } from '@/types';

interface PromptBlockProps {
  block: PromptBlockType;
  section: PromptSection;
  position: number;
  total: number;
}

function areEqual(prev: PromptBlockProps, next: PromptBlockProps): boolean {
  return (
    prev.block.content === next.block.content &&
    prev.block.section_slug === next.block.section_slug &&
    prev.position === next.position &&
    prev.total === next.total
  );
}

export const PromptBlock: React.FC<PromptBlockProps> = React.memo(
  ({ block, section, position, total }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const labelId = useId();
    const colors = getSectionColors(block.section_slug);
    const Icon = useDynamicIcon(section.icon);

    const updateBlockContent = useBuilderStore((s) => s.updateBlockContent);
    const removeBlock = useBuilderStore((s) => s.removeBlock);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: block.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    // Auto-resize textarea
    const autoResize = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
      autoResize();
    }, [block.content, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateBlockContent(block.id, e.target.value);
    };

    return (
      <motion.article
        ref={setNodeRef}
        layout="position"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={style}
        role="article"
        aria-label={`Blok: ${section.name}, pozycja ${position} z ${total}`}
        aria-roledescription="sortable"
        className={[
          'group rounded-lg border bg-surface-1 shadow-sm',
          isDragging ? 'z-50 shadow-xl' : '',
          colors.border,
        ].join(' ')}
      >
        {/* Header */}
        <div className={`flex items-center gap-2 rounded-t-lg border-b px-3 py-2 ${colors.bg} ${colors.border}`}>
          {/* Drag handle */}
          <button
            aria-label="Przeciągnij aby zmienić kolejność"
            className={`cursor-grab active:cursor-grabbing ${colors.text} touch-none`}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={14} />
          </button>

          <span id={labelId} className="sr-only">
            Użyj spacji aby podnieść blok, strzałek aby przenieść, Enter aby upuścić
          </span>

          {/* Section icon + name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${colors.text}`}>
                {Icon && <Icon size={12} />}
                {section.name}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {section.description}
            </TooltipContent>
          </Tooltip>

          {/* Delete button */}
          <button
            onClick={() => removeBlock(block.id)}
            aria-label={`Usuń blok: ${section.name}`}
            className={[
              'ml-auto rounded p-0.5 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              'coarse:opacity-100', // always visible on touch devices
              `${colors.text} hover:bg-white/10`,
            ].join(' ')}
          >
            <X size={12} />
          </button>
        </div>

        {/* Content area */}
        <div className="relative p-2">
          <PromptBlockOverlay content={block.content} />
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleChange}
            onInput={autoResize}
            placeholder={`Wpisz treść sekcji "${section.name}"…`}
            rows={3}
            className={[
              'relative z-10 w-full resize-none bg-transparent',
              'font-mono text-xs leading-relaxed text-text-primary',
              'placeholder:text-text-muted',
              'focus:outline-none',
              'p-2',
            ].join(' ')}
            aria-label={`Treść sekcji ${section.name}`}
          />
        </div>
      </motion.article>
    );
  },
  areEqual,
);
PromptBlock.displayName = 'PromptBlock';
