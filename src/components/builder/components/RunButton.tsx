import React, { useState } from 'react';
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
import { Play, ChevronDown, Loader2, Key } from 'lucide-react';
import { useI18n, type Lang } from '@/lib/i18n';
import { RUN_PROVIDER_MODELS, type RunProviderName } from '@/lib/ai/run-provider.factory';
import { CreditsCounter } from './CreditsCounter';
import { useRunPrompt } from '../hooks/useRunPrompt';

interface RunButtonProps {
  getPromptText: () => string;
  lang: Lang;
}

export const RunButton: React.FC<RunButtonProps> = ({ getPromptText, lang }) => {
  const { t } = useI18n(lang);
  const [provider, setProvider] = useState<RunProviderName>('openai');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [useByok, setUseByok] = useState(false);

  const { state, output, error, creditsRemaining, run, cancel, reset } = useRunPrompt();

  const isRunning = state === 'running';

  const handleProviderChange = (value: string) => {
    const p = value as RunProviderName;
    setProvider(p);
    setModel(RUN_PROVIDER_MODELS[p][0]);
  };

  const handleRun = () => {
    const text = getPromptText();
    if (!text.trim()) return;
    run(text, { provider, model, useByok });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {/* Run button */}
        <Button
          variant={isRunning ? 'destructive' : 'default'}
          size="sm"
          onClick={isRunning ? cancel : handleRun}
          disabled={state === 'done' && !output}
          className="flex-1 gap-1.5"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('run.cancel')}
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              {t('run.runPrompt')}
            </>
          )}
        </Button>

        {/* Model selector dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="px-2" disabled={isRunning}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Provider selection */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('run.provider')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={provider} onValueChange={handleProviderChange}>
              <DropdownMenuRadioItem value="openai">OpenAI</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="anthropic">Anthropic</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* Model selection */}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('run.model')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
              {RUN_PROVIDER_MODELS[provider].map((m) => (
                <DropdownMenuRadioItem key={m} value={m}>
                  {m}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* BYOK toggle */}
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
              <Key className="h-3 w-3" />
              {t('run.keySource')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={useByok ? 'byok' : 'hosted'}
              onValueChange={(v) => setUseByok(v === 'byok')}
            >
              <DropdownMenuRadioItem value="hosted">{t('run.keyHosted')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="byok">{t('run.keyByok')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Credits display (hosted mode only) */}
      {!useByok && (
        <CreditsCounter lang={lang} liveRemaining={creditsRemaining} />
      )}

      {/* Response panel */}
      {state !== 'idle' && (
        <div className="mt-1">
          {/* Inline panel import to avoid circular deps */}
          <RunResponseInline
            state={state}
            output={output}
            error={error}
            lang={lang}
            onCancel={cancel}
            onReset={reset}
          />
        </div>
      )}
    </div>
  );
};

// Inline sub-component to avoid a separate lazy import for a small piece
const RunResponseInline: React.FC<{
  state: ReturnType<typeof useRunPrompt>['state'];
  output: string;
  error: string | null;
  lang: Lang;
  onCancel: () => void;
  onReset: () => void;
}> = ({ state, output, error, lang, onCancel, onReset }) => {
  // Lazy import the panel component to keep RunButton lean
  const Panel = React.lazy(() =>
    import('./RunResponsePanel').then((m) => ({ default: m.RunResponsePanel })),
  );
  return (
    <React.Suspense fallback={null}>
      <Panel
        state={state}
        output={output}
        error={error}
        lang={lang}
        onCancel={onCancel}
        onReset={onReset}
      />
    </React.Suspense>
  );
};
