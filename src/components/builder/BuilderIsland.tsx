import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BuilderToolbar } from './components/BuilderToolbar';
import { SectionPalette } from './components/SectionPalette';
import { DragDropCanvas } from './components/DragDropCanvas';
import { VariableForm } from './components/VariableForm';
import { MarkdownPreview } from './components/MarkdownPreview';
import { useBuilderStore } from './store/builder.store';
import { useVariableDetection } from './hooks/useVariableDetection';
import { PROMPT_SECTIONS } from '@/lib/constants';
import type { Prompt, PromptSection } from '@/types';

interface BuilderIslandProps {
  initialPrompt?: Prompt;
  sections?: PromptSection[];
}

export const BuilderIsland: React.FC<BuilderIslandProps> = ({
  initialPrompt,
  sections = PROMPT_SECTIONS as PromptSection[],
}) => {
  const loadPrompt = useBuilderStore((s) => s.loadPrompt);
  const reset = useBuilderStore((s) => s.reset);
  const save = useBuilderStore((s) => s.save);

  // Load initial prompt once
  useEffect(() => {
    if (initialPrompt) {
      loadPrompt(initialPrompt);
    } else {
      reset();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Variable detection
  useVariableDetection();

  // Save wrapper with toast feedback
  const handleSave = async () => {
    try {
      await save();
      toast.success('Prompt zapisany', { duration: 2000 });
    } catch {
      toast.error('Nie udało się zapisać', {
        action: { label: 'Spróbuj ponownie', onClick: handleSave },
      });
    }
  };

  // Warn before leaving if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const { isDirty } = useBuilderStore.getState();
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const RightPanel = (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <MarkdownPreview />
      <VariableForm />
    </div>
  );

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex h-screen flex-col overflow-hidden bg-bg-base">
        {/* Toolbar */}
        <BuilderToolbar onBack={() => history.back()} />

        {/* Desktop layout: 3 columns xl, 2 columns lg */}
        <div className="hidden flex-1 overflow-hidden lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[280px_1fr_320px]">
          {/* Left: section palette (visible on xl only) */}
          <div className="hidden overflow-y-auto border-r border-border xl:block">
            <SectionPalette sections={sections} />
          </div>

          {/* Center: canvas */}
          <div className="overflow-y-auto border-r border-border">
            <DragDropCanvas sections={sections} />
          </div>

          {/* Right: preview + variables */}
          <div className="overflow-hidden">{RightPanel}</div>
        </div>

        {/* Mobile/tablet: tabs */}
        <div className="flex-1 overflow-hidden lg:hidden">
          <Tabs defaultValue="canvas" className="flex h-full flex-col">
            <TabsList className="mx-4 mt-2 grid w-auto grid-cols-3">
              <TabsTrigger value="palette">Sekcje</TabsTrigger>
              <TabsTrigger value="canvas">Kanwa</TabsTrigger>
              <TabsTrigger value="preview">Podgląd</TabsTrigger>
            </TabsList>

            <TabsContent value="palette" className="flex-1 overflow-y-auto">
              <SectionPalette sections={sections} />
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 overflow-y-auto">
              <DragDropCanvas sections={sections} />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden">
              {RightPanel}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BuilderIsland;
