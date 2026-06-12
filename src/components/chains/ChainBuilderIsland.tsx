import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, Save, Play, Square, Download, Plus, Loader2, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChainNodeCard } from './components/ChainNodeCard';
import { ExportModal } from './components/ExportModal';
import { useChainBuilder } from './hooks/useChainBuilder';
import { useChainRun } from './hooks/useChainRun';
import { RUN_PROVIDER_MODELS, type RunProviderName } from '@/lib/ai/run-provider.factory';
import type { PromptChainWithNodes } from '@/db/repositories/chain.repo';
import type { Lang } from '@/lib/i18n';

interface ChainBuilderIslandProps {
  chain: PromptChainWithNodes;
  lang: Lang;
}

export const ChainBuilderIsland: React.FC<ChainBuilderIslandProps> = ({ chain, lang }) => {
  const isPl = lang === 'pl';

  const {
    nodes, title, description, isSaving, isPending,
    setTitle, setDescription, addNode, removeNode, updateNode, moveNode, saveAll,
  } = useChainBuilder(chain);

  const { nodeStates, isRunning, runChain, cancelRun, resetRun } = useChainRun(nodes.length);

  // Run settings
  const [provider, setProvider] = useState<RunProviderName>('anthropic');
  const [model, setModel] = useState<string>('claude-haiku-4-5-20251001');
  const [useByok, setUseByok] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleProviderChange = (v: string) => {
    const p = v as RunProviderName;
    setProvider(p);
    setModel(RUN_PROVIDER_MODELS[p][0]);
  };

  const handleRun = useCallback(() => {
    void runChain(nodes, { provider, model, useByok });
  }, [nodes, provider, model, useByok, runChain]);

  const hasOutput = nodeStates.some((s) => s.output || s.error);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-base">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-base px-4">
        <button
          onClick={() => history.back()}
          aria-label={isPl ? 'Wróć' : 'Back'}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Chain title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isPl ? 'Tytuł łańcucha…' : 'Chain title…'}
          disabled={isRunning}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
          aria-label={isPl ? 'Tytuł łańcucha' : 'Chain title'}
        />

        {/* Export button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportOpen(true)}
          disabled={nodes.length === 0}
          className="hidden gap-1.5 sm:flex"
        >
          <Download size={14} />
          {isPl ? 'Eksportuj' : 'Export'}
        </Button>

        {/* Save */}
        <Button
          size="sm"
          variant="outline"
          onClick={saveAll}
          disabled={isSaving || isRunning}
          className="gap-1.5"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span className="hidden sm:inline">{isPl ? 'Zapisz' : 'Save'}</span>
        </Button>

        {/* Run controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isRunning ? 'destructive' : 'default'}
            onClick={isRunning ? cancelRun : handleRun}
            disabled={nodes.length === 0 || isPending}
            className="gap-1.5"
          >
            {isRunning ? (
              <><Square size={14} /> {isPl ? 'Zatrzymaj' : 'Stop'}</>
            ) : (
              <><Play size={14} /> {isPl ? 'Uruchom' : 'Run'}</>
            )}
          </Button>

          {/* Model picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isRunning} className="px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {isPl ? 'Dostawca' : 'Provider'}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={provider} onValueChange={handleProviderChange}>
                <DropdownMenuRadioItem value="openai">OpenAI</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="anthropic">Anthropic</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {isPl ? 'Model' : 'Model'}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
                {RUN_PROVIDER_MODELS[provider].map((m) => (
                  <DropdownMenuRadioItem key={m} value={m}>{m}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {isPl ? 'Klucz API' : 'API key'}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={useByok ? 'byok' : 'hosted'} onValueChange={(v) => setUseByok(v === 'byok')}>
                <DropdownMenuRadioItem value="hosted">{isPl ? 'Platformowy' : 'Hosted'}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="byok">BYOK</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasOutput && !isRunning && (
            <Button variant="ghost" size="sm" onClick={resetRun} className="px-2" title={isPl ? 'Wyczyść wyniki' : 'Clear results'}>
              <RotateCcw size={14} />
            </Button>
          )}
        </div>
      </header>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Description */}
          <div className="mb-6">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isPl ? 'Opis łańcucha (opcjonalnie)…' : 'Chain description (optional)…'}
              disabled={isRunning}
              className="w-full bg-transparent text-sm text-text-muted placeholder:text-text-muted/50 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-text-muted">
                {isPl ? 'Brak kroków' : 'No steps yet'}
              </p>
              <p className="text-xs text-text-muted/60">
                {isPl
                  ? 'Dodaj pierwszy krok, aby zbudować łańcuch promptów'
                  : 'Add the first step to build your prompt chain'}
              </p>
            </div>
          )}

          {/* Node list */}
          <div
            className={`flex flex-col gap-0 transition-opacity ${isPending ? 'opacity-60' : ''}`}
            aria-busy={isPending}
          >
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* Arrow connector between nodes */}
                {index > 0 && (
                  <div className="flex flex-col items-center py-1" aria-hidden>
                    <div className="h-4 w-px bg-border" />
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-border">
                      <path d="M0 0L5 6L10 0" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <ChainNodeCard
                  node={node}
                  index={index}
                  total={nodes.length}
                  runState={nodeStates[index]}
                  isRunning={isRunning}
                  isPl={isPl}
                  onChange={updateNode}
                  onRemove={removeNode}
                  onMoveUp={() => moveNode(index, index - 1)}
                  onMoveDown={() => moveNode(index, index + 1)}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Add step button */}
          {!isRunning && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={addNode}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border px-5 py-3 text-sm text-text-muted transition-colors hover:border-brand-400 hover:text-brand-400"
              >
                <Plus size={16} />
                {isPl ? 'Dodaj krok' : 'Add step'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Export modal */}
      <ExportModal
        open={exportOpen}
        chainId={chain.id}
        isPl={isPl}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
};

export default ChainBuilderIsland;
