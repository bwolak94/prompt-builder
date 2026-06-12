import React, { useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { PromptBlock } from './PromptBlock';
import { useBuilderStore } from '../store/builder.store';
import type { PromptSection } from '@/types';
import type { Lang } from '@/lib/i18n';

interface DragDropCanvasProps {
  sections: PromptSection[];
  lang?: Lang;
}

export const DragDropCanvas: React.FC<DragDropCanvasProps> = ({ sections, lang = 'pl' }) => {
  const blocks = useBuilderStore((s) => s.blocks);
  const addBlock = useBuilderStore((s) => s.addBlock);
  const reorderBlocks = useBuilderStore((s) => s.reorderBlocks);
  const setActiveBlockId = useBuilderStore((s) => s.setActiveBlockId);
  const activeBlockId = useBuilderStore((s) => s.activeBlockId);

  const sectionMap = React.useMemo(
    () => new Map(sections.map((s) => [s.slug, s])),
    [sections],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveBlockId(String(e.active.id));
  }, [setActiveBlockId]);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveBlockId(null);
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      // Drop from palette
      if (String(active.id).startsWith('palette-')) {
        const sectionSlug = (active.data.current as { sectionSlug?: string })?.sectionSlug;
        if (sectionSlug) addBlock(sectionSlug);
        return;
      }

      reorderBlocks(String(active.id), String(over.id));
    },
    [addBlock, reorderBlocks, setActiveBlockId],
  );

  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
  const activeBlock = activeBlockId ? blocks.find((b) => b.id === activeBlockId) : null;
  const activeSection = activeBlock ? sectionMap.get(activeBlock.section_slug) : null;

  const defaultSection: PromptSection = {
    slug: 'unknown',
    name: 'Sekcja',
    description: '',
    category: 'core',
    icon: 'Square',
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sorted.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-full flex-col gap-3 p-4">
          {sorted.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center"
              aria-live="polite"
            >
              <Plus size={24} className="text-text-muted" />
              <p className="text-sm text-text-muted">
                Przeciągnij sekcje lub kliknij +
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {sorted.map((block, i) => {
              const section = sectionMap.get(block.section_slug) ?? defaultSection;
              return (
                <PromptBlock
                  key={block.id}
                  block={block}
                  section={section}
                  position={i + 1}
                  total={sorted.length}
                  lang={lang}
                />
              );
            })}
          </AnimatePresence>

          {/* Add section button */}
          <button
            onClick={() => {
              // First section slug not yet added, or default to 'role'
              const firstAvailable = sections.find(
                (s) => !blocks.some((b) => b.section_slug === s.slug),
              );
              addBlock(firstAvailable?.slug ?? sections[0]?.slug ?? 'role');
            }}
            className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-text-muted transition-colors hover:border-brand-500/50 hover:text-brand-400"
          >
            <Plus size={14} />
            Dodaj sekcję
          </button>
        </div>
      </SortableContext>

      {/* Drag overlay ghost */}
      <DragOverlay>
        {activeBlock && activeSection && (
          <div className="rotate-1 scale-105 opacity-80 shadow-2xl">
            <PromptBlock
              block={activeBlock}
              section={activeSection}
              position={0}
              total={0}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
