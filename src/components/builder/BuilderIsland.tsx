import React, { lazy, Suspense, useEffect, useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { BuilderToolbar } from './components/BuilderToolbar';
import { SectionPalette } from './components/SectionPalette';
import { DragDropCanvas } from './components/DragDropCanvas';
import { VariableForm } from './components/VariableForm';
import { MarkdownPreview } from './components/MarkdownPreview';
import { RunButton } from './components/RunButton';
import { VersionsPanel } from './components/VersionsPanel';
import { ABTestView } from './components/ABTestView';
import { useBuilderStore } from './store/builder.store';
import { useVariableDetection } from './hooks/useVariableDetection';
import { useBuilderSave } from './hooks/useBuilderSave';
import { useAutoCategorize } from './hooks/useAutoCategorize';
import { useMarkdownGeneration } from './hooks/useMarkdownGeneration';
import { AutoTagModal } from './components/AutoTagModal';
import { ImportModal } from './components/ImportModal';
import { ImproveModal } from './components/ImproveModal';
import { TokenOptimizerModal } from './components/TokenOptimizerModal';
import { getPromptSections } from '@/lib/constants';
import { useI18n, type Lang } from '@/lib/i18n';
import type { Prompt, PromptSection, AIProvider } from '@/types';

const AIScoreIsland = lazy(() =>
  import('@/components/ai-score/AIScoreIsland').then((m) => ({ default: m.AIScoreIsland })),
);

const MultiModelScoreIsland = lazy(() =>
  import('@/components/ai-score/MultiModelScoreIsland').then((m) => ({ default: m.MultiModelScoreIsland })),
);

interface BuilderIslandProps {
  initialPrompt?: Prompt;
  sections?: PromptSection[];
  aiProvider?: AIProvider;
  lang?: Lang;
}

export const BuilderIsland: React.FC<BuilderIslandProps> = ({
  initialPrompt,
  sections,
  aiProvider = 'openai',
  lang = 'pl',
}) => {
  const { t } = useI18n(lang);
  const resolvedSections = sections ?? (getPromptSections(lang) as PromptSection[]);
  const loadPrompt = useBuilderStore((s) => s.loadPrompt);
  const reset = useBuilderStore((s) => s.reset);
  const promptId = useBuilderStore((s) => s.promptId);
  const [abMode, setAbMode] = useState(false);

  // Load initial prompt once
  useEffect(() => {
    if (initialPrompt) {
      loadPrompt(initialPrompt);
    } else {
      reset();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Variable detection + save/autosave/beforeunload
  useVariableDetection();
  const { suggestAndToast, suggestion, editOpen, setEditOpen, applyTags } = useAutoCategorize(lang);
  const { handleSave } = useBuilderSave(lang, { onSaved: suggestAndToast });
  const loadImportedBlocks = useBuilderStore((s) => s.loadImportedBlocks);
  const [importOpen, setImportOpen] = useState(false);
  const [improveAllOpen, setImproveAllOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const markdown = useMarkdownGeneration();

  // Stable getter passed to RunButton — avoids re-renders on markdown change
  const getPromptText = useCallback(() => markdown ?? '', [markdown]);

  const RightPanel = (
    <Tabs defaultValue="preview" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-2 shrink-0">
        <TabsList className="grid flex-1 grid-cols-2">
          <TabsTrigger value="preview">{t('builder.preview')}</TabsTrigger>
          <TabsTrigger value="history">{t('versions.title')}</TabsTrigger>
        </TabsList>
        {promptId && (
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => setAbMode(true)}>
            {t('ab.enterMode')}
          </Button>
        )}
      </div>

      <TabsContent value="preview" className="flex-1 overflow-y-auto p-4 mt-0">
        <div className="flex flex-col gap-4">
          <MarkdownPreview />
          <VariableForm />
          <RunButton getPromptText={getPromptText} lang={lang} />
          {promptId && markdown && (
            <Suspense fallback={null}>
              <AIScoreIsland
                promptId={promptId}
                content={markdown}
                provider={aiProvider}
              />
            </Suspense>
          )}
          {promptId && markdown && (
            <Suspense fallback={null}>
              <MultiModelScoreIsland
                promptId={promptId}
                content={markdown}
                isPl={lang === 'pl'}
              />
            </Suspense>
          )}
        </div>
      </TabsContent>

      <TabsContent value="history" className="flex-1 overflow-y-auto mt-0">
        <VersionsPanel lang={lang} />
      </TabsContent>
    </Tabs>
  );

  // A/B mode takes over the whole builder area
  const TagModal = suggestion && promptId && (
    <AutoTagModal
      open={editOpen}
      suggestion={suggestion}
      promptId={promptId}
      lang={lang}
      onApply={applyTags}
      onClose={() => setEditOpen(false)}
    />
  );

  const ImportModalEl = (
    <ImportModal
      open={importOpen}
      lang={lang}
      onImport={(title, blocks) => loadImportedBlocks(title, blocks)}
      onClose={() => setImportOpen(false)}
    />
  );

  const ImproveAllModalEl = markdown ? (
    <ImproveModal
      open={improveAllOpen}
      lang={lang}
      mode="full"
      content={markdown}
      onApply={(improved) => loadImportedBlocks('', [{ id: 'improved', section_slug: 'task', content: improved, order_index: 0 }])}
      onClose={() => setImproveAllOpen(false)}
    />
  ) : null;

  const OptimizeModalEl = markdown ? (
    <TokenOptimizerModal
      open={optimizeOpen}
      lang={lang}
      content={markdown}
      onApply={(optimized) => loadImportedBlocks('', [{ id: 'optimized', section_slug: 'task', content: optimized, order_index: 0 }])}
      onClose={() => setOptimizeOpen(false)}
    />
  ) : null;

  if (abMode) {
    return (
      <TooltipProvider delayDuration={500}>
        <div className="flex h-screen flex-col overflow-hidden bg-surface-base">
          <BuilderToolbar onBack={() => history.back()} onSave={handleSave} onImport={() => setImportOpen(true)} onImproveAll={() => setImproveAllOpen(true)} onOptimize={() => setOptimizeOpen(true)} lang={lang} />
          <ABTestView
            sections={resolvedSections}
            lang={lang}
            onExit={() => setAbMode(false)}
          />
        </div>
        {TagModal}
        {ImportModalEl}
        {ImproveAllModalEl}
        {OptimizeModalEl}
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex h-screen flex-col overflow-hidden bg-surface-base">
        {/* Toolbar */}
        <BuilderToolbar onBack={() => history.back()} onSave={handleSave} onImport={() => setImportOpen(true)} onImproveAll={() => setImproveAllOpen(true)} onOptimize={() => setOptimizeOpen(true)} lang={lang} />

        {/* Desktop layout: 3 columns xl, 2 columns lg */}
        <div className="hidden flex-1 overflow-hidden lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[280px_1fr_320px]">
          {/* Left: section palette (visible on xl only) */}
          <div className="hidden overflow-y-auto border-r border-border xl:block">
            <SectionPalette sections={resolvedSections} />
          </div>

          {/* Center: canvas */}
          <div className="overflow-y-auto border-r border-border">
            <DragDropCanvas sections={resolvedSections} lang={lang} />
          </div>

          {/* Right: preview + variables + history */}
          <div className="flex flex-col overflow-hidden">{RightPanel}</div>
        </div>

        {/* Mobile/tablet: tabs */}
        <div className="flex-1 overflow-hidden lg:hidden">
          <Tabs defaultValue="canvas" className="flex h-full flex-col">
            <TabsList className="mx-4 mt-2 grid w-auto grid-cols-3">
              <TabsTrigger value="palette">{t('builder.sectionPaletteTitle')}</TabsTrigger>
              <TabsTrigger value="canvas">{t('builder.edit')}</TabsTrigger>
              <TabsTrigger value="preview">{t('builder.preview')}</TabsTrigger>
            </TabsList>

            <TabsContent value="palette" className="flex-1 overflow-y-auto">
              <SectionPalette sections={resolvedSections} />
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 overflow-y-auto">
              <DragDropCanvas sections={resolvedSections} lang={lang} />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden">
              {RightPanel}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {TagModal}
      {ImportModalEl}
      {ImproveAllModalEl}
      {OptimizeModalEl}
    </TooltipProvider>
  );
};

export default BuilderIsland;
