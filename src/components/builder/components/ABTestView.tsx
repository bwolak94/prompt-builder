import React, { Suspense, lazy, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n, type Lang } from '@/lib/i18n';
import { useABTest } from '../hooks/useABTest';
import { useBuilderStore } from '../store/builder.store';
import type { PromptSection, ScoreResult, PromptBlock } from '@/types';
import type { LineDiff } from '@/lib/diff';
import type { RunProviderName } from '@/lib/ai/run-provider.factory';

const ScoreRadarChartOverlay = lazy(() =>
  import('@/components/ai-score/components/ScoreRadarChartOverlay').then((m) => ({
    default: m.ScoreRadarChartOverlay,
  })),
);

interface ABTestViewProps {
  sections: PromptSection[];
  lang?: Lang;
  onExit: () => void;
}

export const ABTestView: React.FC<ABTestViewProps> = ({ sections, lang = 'pl', onExit }) => {
  const { t } = useI18n(lang);
  const promptId = useBuilderStore((s) => s.promptId);
  const {
    test,
    status,
    error,
    variantBBlocks,
    responseA,
    responseB,
    scoreA,
    scoreB,
    diff,
    isRunning,
    isScoring,
    createTest,
    updateVariantB,
    scoreOffline,
    runLive,
    cancelRun,
    applyWinner,
    exitABMode,
  } = useABTest();

  const handleEnterABMode = useCallback(async () => {
    if (!promptId) return;
    await createTest(promptId);
  }, [promptId, createTest]);

  const handleApplyB = useCallback(async () => {
    await applyWinner('b', true);
    exitABMode();
    onExit();
    window.location.reload();
  }, [applyWinner, exitABMode, onExit]);

  const handleKeepBoth = useCallback(async () => {
    await applyWinner('tie', false);
    exitABMode();
    onExit();
  }, [applyWinner, exitABMode, onExit]);

  const handleExit = useCallback(() => {
    exitABMode();
    onExit();
  }, [exitABMode, onExit]);

  // ── Not yet started ───────────────────────────────────────────────────────
  if (!test) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm font-medium">{t('ab.enterModeDesc')}</p>
        <Button
          disabled={!promptId || status === 'creating'}
          onClick={() => void handleEnterABMode()}
        >
          {status === 'creating' ? t('ab.creating') : t('ab.enterMode')}
        </Button>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <Button variant="ghost" size="sm" onClick={handleExit}>
          {t('common.cancel')}
        </Button>
      </div>
    );
  }

  const winner =
    scoreA && scoreB
      ? scoreA.overall_score > scoreB.overall_score
        ? 'A'
        : scoreB.overall_score > scoreA.overall_score
          ? 'B'
          : t('ab.tie')
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header bar */}
      <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            A/B
          </Badge>
          <span className="text-sm font-medium">{t('ab.title')}</span>
          {winner && (
            <Badge className="bg-green-500/10 text-[10px] text-green-600 dark:text-green-400">
              {t('ab.winner')}: {winner}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button size="sm" variant="outline" onClick={cancelRun}>
              {t('run.cancel')}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isScoring}
                onClick={() => void scoreOffline()}
              >
                {isScoring ? t('ab.scoring') : t('ab.scoreOffline')}
              </Button>
              <Button
                size="sm"
                disabled={isRunning}
                onClick={() => void runLive('openai' as RunProviderName, 'gpt-4o-mini', false)}
              >
                {t('ab.runLive')}
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={handleExit}>
            {t('ab.exit')}
          </Button>
        </div>
      </div>

      {/* Side-by-side editor + output layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Variant A — read-only */}
        <div className="border-border flex w-1/2 flex-col overflow-hidden border-r">
          <div className="border-border bg-muted/30 flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
            <Badge variant="secondary" className="text-[10px]">
              A
            </Badge>
            <span className="text-muted-foreground text-xs">{t('ab.variantA')}</span>
            {scoreA && (
              <Badge className="ml-auto text-[10px]">{Math.round(scoreA.overall_score)}/100</Badge>
            )}
          </div>
          <ReadOnlyBlockList blocks={test.variant_a.blocks} sections={sections} />
        </div>

        {/* Variant B — editable */}
        <div className="flex w-1/2 flex-col overflow-hidden">
          <div className="border-border bg-muted/30 flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
            <Badge variant="secondary" className="bg-cyan-500/10 text-[10px] text-cyan-600">
              B
            </Badge>
            <span className="text-muted-foreground text-xs">{t('ab.variantB')}</span>
            {scoreB && (
              <Badge className="ml-auto text-[10px]">{Math.round(scoreB.overall_score)}/100</Badge>
            )}
          </div>
          <VariantBEditor blocks={variantBBlocks} sections={sections} onUpdate={updateVariantB} />
        </div>
      </div>

      {/* Comparison panel */}
      <div className="border-border shrink-0 border-t">
        <Tabs defaultValue="diff" className="flex flex-col">
          <div className="border-border flex items-center justify-between border-b px-4">
            <TabsList className="h-9 gap-1 bg-transparent p-0">
              <TabsTrigger value="diff" className="h-8 text-xs">
                {t('ab.tabDiff')}
              </TabsTrigger>
              <TabsTrigger value="score" className="h-8 text-xs">
                {t('ab.tabScore')}
              </TabsTrigger>
              <TabsTrigger value="responses" className="h-8 text-xs">
                {t('ab.tabResponses')}
              </TabsTrigger>
            </TabsList>

            {/* Action buttons */}
            <div className="flex items-center gap-2 py-1">
              <Button size="sm" variant="outline" onClick={() => void handleKeepBoth()}>
                {t('ab.keepBoth')}
              </Button>
              <Button size="sm" variant="default" onClick={() => void handleApplyB()}>
                {t('ab.applyB')}
              </Button>
            </div>
          </div>

          <TabsContent value="diff" className="mt-0 max-h-52 overflow-hidden">
            <ScrollArea className="h-52">
              <DiffView diff={diff} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="score" className="mt-0 max-h-72 overflow-hidden">
            <ScoreTab scoreA={scoreA} scoreB={scoreB} />
          </TabsContent>

          <TabsContent value="responses" className="mt-0 max-h-52 overflow-hidden">
            <ResponseTab responseA={responseA} responseB={responseB} isRunning={isRunning} />
          </TabsContent>
        </Tabs>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive shrink-0 px-4 py-2 text-xs">{error}</div>
      )}
    </div>
  );
};

// ── Read-only block list for Variant A ───────────────────────────────────────

interface ReadOnlyBlockListProps {
  blocks: PromptBlock[];
  sections: PromptSection[];
}

const ReadOnlyBlockList: React.FC<ReadOnlyBlockListProps> = ({ blocks, sections }) => {
  if (blocks.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-4 text-xs">
        No blocks.
      </div>
    );
  }
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-3">
        {blocks.map((block) => {
          const section = sections.find((s) => s.slug === block.section_slug);
          return (
            <div key={block.id} className="border-border bg-card rounded-md border p-2 opacity-75">
              <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                {section?.name ?? block.section_slug}
              </p>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{block.content}</p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// ── Variant B editor ──────────────────────────────────────────────────────────

interface VariantBEditorProps {
  blocks: PromptBlock[];
  sections: PromptSection[];
  onUpdate: (blocks: PromptBlock[], contentMd: string) => void;
}

const VariantBEditor: React.FC<VariantBEditorProps> = ({ blocks, sections, onUpdate }) => {
  const handleBlockChange = useCallback(
    (id: string, content: string) => {
      const updated = blocks.map((b) => (b.id === id ? { ...b, content } : b));
      const contentMd = updated.map((b) => b.content).join('\n\n');
      onUpdate(updated, contentMd);
    },
    [blocks, onUpdate],
  );

  if (blocks.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-4 text-xs">
        No blocks in variant B.
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-3">
        {blocks.map((block) => {
          const section = sections.find((s) => s.slug === block.section_slug);
          return (
            <div key={block.id} className="border-border bg-card rounded-md border p-2">
              <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                {section?.name ?? block.section_slug}
              </p>
              <textarea
                className="w-full resize-none bg-transparent text-xs outline-none"
                rows={3}
                value={block.content}
                onChange={(e) => handleBlockChange(block.id, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// ── Score tab ─────────────────────────────────────────────────────────────────

interface ScoreTabProps {
  scoreA: ScoreResult | null;
  scoreB: ScoreResult | null;
}

const ScoreTab: React.FC<ScoreTabProps> = ({ scoreA, scoreB }) => {
  if (!scoreA || !scoreB) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-xs">
        Run offline scoring to see comparison.
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-around text-xs">
        <span className="font-medium text-violet-500">
          A: {Math.round(scoreA.overall_score)}/100
        </span>
        <span className="text-muted-foreground">vs</span>
        <span className="font-medium text-cyan-500">B: {Math.round(scoreB.overall_score)}/100</span>
      </div>
      <Suspense fallback={<div className="bg-muted h-[260px] animate-pulse rounded" />}>
        <ScoreRadarChartOverlay scoresA={scoreA.scores} scoresB={scoreB.scores} />
      </Suspense>
    </div>
  );
};

// ── Response tab ──────────────────────────────────────────────────────────────

interface ResponseTabProps {
  responseA: string;
  responseB: string;
  isRunning: boolean;
}

const ResponseTab: React.FC<ResponseTabProps> = ({ responseA, responseB, isRunning }) => {
  if (!responseA && !responseB && !isRunning) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-xs">
        Run both variants live to see responses.
      </div>
    );
  }

  return (
    <div className="divide-border grid h-52 grid-cols-2 divide-x overflow-hidden">
      <ScrollArea className="h-52">
        <div className="p-3">
          <p className="mb-1 text-[10px] font-medium tracking-wide text-violet-500 uppercase">A</p>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap">
            {responseA}
            {isRunning && <span className="inline-block h-3 w-0.5 animate-pulse bg-current" />}
          </pre>
        </div>
      </ScrollArea>
      <ScrollArea className="h-52">
        <div className="p-3">
          <p className="mb-1 text-[10px] font-medium tracking-wide text-cyan-500 uppercase">B</p>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap">
            {responseB}
            {isRunning && <span className="inline-block h-3 w-0.5 animate-pulse bg-current" />}
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Diff view ─────────────────────────────────────────────────────────────────

interface DiffViewProps {
  diff: LineDiff[];
}

const DiffView: React.FC<DiffViewProps> = ({ diff }) => {
  if (diff.length === 0 || diff.every((d) => d.type === 'unchanged')) {
    return (
      <p className="text-muted-foreground p-4 text-xs">
        No differences yet. Edit Variant B to see changes.
      </p>
    );
  }

  return (
    <pre className="p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
      {diff.map((entry, i) => (
        <span
          key={i}
          className={
            entry.type === 'added'
              ? 'block bg-green-500/10 text-green-700 dark:text-green-400'
              : entry.type === 'removed'
                ? 'block bg-red-500/10 text-red-700 dark:text-red-400'
                : 'text-foreground/50 block'
          }
        >
          {entry.type === 'added' ? '+ ' : entry.type === 'removed' ? '- ' : '  '}
          {entry.line}
        </span>
      ))}
    </pre>
  );
};
