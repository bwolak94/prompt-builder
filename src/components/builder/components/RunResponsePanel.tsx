import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, StopCircle, RotateCcw } from 'lucide-react';
import { useI18n, type Lang } from '@/lib/i18n';
import type { RunState } from '../hooks/useRunPrompt';

interface RunResponsePanelProps {
  state: RunState;
  output: string;
  error: string | null;
  lang: Lang;
  onCancel: () => void;
  onReset: () => void;
}

export const RunResponsePanel: React.FC<RunResponsePanelProps> = ({
  state,
  output,
  error,
  lang,
  onCancel,
  onReset,
}) => {
  const { t } = useI18n(lang);
  const [copied, setCopied] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as output streams in
  useEffect(() => {
    if (state === 'running') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, state]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state === 'idle') return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-base p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('run.responseTitle')}
        </span>
        <div className="flex items-center gap-1">
          {state === 'running' && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel} title={t('run.cancel')}>
              <StopCircle className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
          {(state === 'done' || state === 'error') && (
            <>
              {output && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title={t('common.copy')}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset} title={t('run.reset')}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Output area */}
      <ScrollArea className="max-h-64">
        <div className="min-h-[3rem]">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
              {output}
              {state === 'running' && (
                <span className="animate-pulse text-primary">▋</span>
              )}
            </pre>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
