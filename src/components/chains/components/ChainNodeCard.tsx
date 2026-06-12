import React, { useId } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { LocalNode } from '../hooks/useChainBuilder';
import type { NodeRunState } from '../hooks/useChainRun';

interface ChainNodeCardProps {
  node: LocalNode;
  index: number;
  total: number;
  runState?: NodeRunState;
  isRunning: boolean;
  isPl: boolean;
  onChange: (id: string, fields: Partial<Pick<LocalNode, 'title' | 'content_md'>>) => void;
  onRemove: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export const ChainNodeCard: React.FC<ChainNodeCardProps> = ({
  node,
  index,
  total,
  runState,
  isRunning,
  isPl,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}) => {
  const titleId = useId();
  const contentId = useId();
  const status = runState?.status ?? 'idle';

  const statusIcon = {
    idle: null,
    running: <Loader2 size={14} className="animate-spin text-brand-400" aria-hidden />,
    done: <CheckCircle2 size={14} className="text-green-500" aria-hidden />,
    error: <AlertCircle size={14} className="text-red-500" aria-hidden />,
  }[status];

  const borderColor = {
    idle: 'border-border',
    running: 'border-brand-400 ring-1 ring-brand-400/30',
    done: 'border-green-500/50',
    error: 'border-red-500/50',
  }[status];

  return (
    <div className={`rounded-xl border bg-surface-raised transition-all ${borderColor}`}>
      {/* Node header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {/* Drag handle */}
        <button
          type="button"
          aria-label={isPl ? 'Przeciągnij' : 'Drag to reorder'}
          className="cursor-grab touch-none text-text-muted hover:text-text-primary active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical size={16} />
        </button>

        {/* Step badge */}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-400">
          {index + 1}
        </span>

        {/* Title input */}
        <label htmlFor={titleId} className="sr-only">
          {isPl ? 'Tytuł kroku' : 'Step title'}
        </label>
        <input
          id={titleId}
          type="text"
          value={node.title}
          onChange={(e) => onChange(node.id, { title: e.target.value })}
          placeholder={isPl ? `Krok ${index + 1}…` : `Step ${index + 1}…`}
          disabled={isRunning}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
        />

        {/* Status icon */}
        {statusIcon}

        {/* Move buttons */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0 || isRunning}
          aria-label={isPl ? 'Przesuń w górę' : 'Move up'}
          className="text-text-muted hover:text-text-primary disabled:opacity-30"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1 || isRunning}
          aria-label={isPl ? 'Przesuń w dół' : 'Move down'}
          className="text-text-muted hover:text-text-primary disabled:opacity-30"
        >
          <ChevronDown size={14} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onRemove(node.id)}
          disabled={isRunning}
          aria-label={isPl ? 'Usuń krok' : 'Remove step'}
          className="text-text-muted hover:text-red-500 disabled:opacity-30"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Prompt content */}
      <div className="p-3">
        <label htmlFor={contentId} className="mb-1 block text-xs text-text-muted">
          {isPl ? 'Treść promptu' : 'Prompt content'}{' '}
          {index > 0 && (
            <span className="text-brand-400">
              — {isPl ? 'użyj {{prev_output}} aby wstawić poprzednią odpowiedź' : 'use {{prev_output}} to insert the previous response'}
            </span>
          )}
        </label>
        <Textarea
          id={contentId}
          value={node.content_md}
          onChange={(e) => onChange(node.id, { content_md: e.target.value })}
          placeholder={
            index === 0
              ? (isPl ? 'Wpisz treść pierwszego kroku…' : 'Enter the first step prompt…')
              : (isPl ? 'Użyj {{prev_output}} aby odwołać się do poprzedniej odpowiedzi…' : 'Use {{prev_output}} to reference the previous response…')
          }
          disabled={isRunning}
          className="min-h-[100px] resize-y font-mono text-xs disabled:opacity-60"
        />
      </div>

      {/* Run output */}
      {runState && (runState.output || runState.error) && (
        <div className={`border-t border-border px-3 py-2 ${runState.status === 'error' ? 'bg-red-50/5' : 'bg-green-50/5'}`}>
          <p className="mb-1 text-xs font-medium text-text-muted">
            {isPl ? 'Odpowiedź:' : 'Output:'}
          </p>
          {runState.error ? (
            <p className="text-xs text-red-500">{runState.error}</p>
          ) : (
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-text-secondary">
              {runState.output}
              {runState.status === 'running' && (
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-400" />
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
