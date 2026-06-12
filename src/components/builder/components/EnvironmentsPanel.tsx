import React, { useState, useCallback, useEffect } from 'react';
import { GitBranch, ArrowRight, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuilderStore } from '../store/builder.store';
import type { Lang } from '@/lib/i18n';

interface EnvironmentData {
  id: string;
  environment: 'dev' | 'staging' | 'production';
  version_number: number | null;
  promoted_at: string;
}

interface PromotionRecord {
  id: string;
  from_env: string;
  to_env: string;
  version_id: string;
  promoted_at: string;
}

interface EnvironmentsPanelProps {
  lang?: Lang;
}

const ENV_COLORS: Record<string, { badge: string; dot: string }> = {
  dev:        { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',      dot: 'bg-sky-400' },
  staging:    { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  production: { badge: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
};

const ENV_LABELS: Record<string, string> = {
  dev: 'Development',
  staging: 'Staging',
  production: 'Production',
};

export const EnvironmentsPanel: React.FC<EnvironmentsPanelProps> = ({ lang = 'pl' }) => {
  const isPl = lang === 'pl';
  const promptId = useBuilderStore((s) => s.promptId);

  const [environments, setEnvironments] = useState<EnvironmentData[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchEnvironments = useCallback(async () => {
    if (!promptId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/environments`);
      if (res.ok) {
        const json = await res.json() as { data: { environments: EnvironmentData[]; promotions: PromotionRecord[] } };
        setEnvironments(json.data.environments);
        setPromotions(json.data.promotions);
      }
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const promote = useCallback(async (targetEnv: 'staging' | 'production') => {
    if (!promptId) return;
    const devEnv = environments.find((e) => e.environment === 'dev');
    if (!devEnv?.version_number) return;

    setPromoting(targetEnv);
    try {
      const res = await fetch(`/api/prompts/${promptId}/environments/${targetEnv}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: devEnv.id }),
      });
      if (res.ok) {
        await fetchEnvironments();
      }
    } finally {
      setPromoting(null);
    }
  }, [promptId, environments, fetchEnvironments]);

  if (!promptId) {
    return (
      <div className="p-4 text-xs text-text-muted">
        {isPl ? 'Zapisz prompt, aby zarządzać środowiskami.' : 'Save the prompt to manage environments.'}
      </div>
    );
  }

  const devEnv  = environments.find((e) => e.environment === 'dev');
  const stagEnv = environments.find((e) => e.environment === 'staging');
  const prodEnv = environments.find((e) => e.environment === 'production');

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch size={14} className="text-brand-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {isPl ? 'Środowiska' : 'Environments'}
        </p>
        {loading && <Loader2 size={12} className="animate-spin text-text-muted ml-auto" />}
      </div>

      {/* Environment cards */}
      {(['dev', 'staging', 'production'] as const).map((env) => {
        const envData = environments.find((e) => e.environment === env);
        const colors = ENV_COLORS[env];
        const isProd = env === 'production';
        const isStag = env === 'staging';
        const canPromote = isStag || isProd;
        const targetLabel = env === 'staging'
          ? (isPl ? 'Promuj dev → staging' : 'Promote dev → staging')
          : (isPl ? 'Promuj staging → production' : 'Promote staging → production');

        return (
          <div
            key={env}
            className="rounded-lg border border-border bg-surface-raised p-3"
          >
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                {ENV_LABELS[env]}
              </span>
              <span className="ml-auto text-[10px] text-text-muted">
                {envData?.version_number
                  ? `v${envData.version_number}`
                  : (isPl ? 'Brak wersji' : 'No version')}
              </span>
            </div>

            {env === 'dev' && (
              <p className="mt-1.5 text-[10px] text-text-muted">
                {isPl ? 'Aktualizuje się automatycznie przy każdym zapisie.' : 'Auto-updates on every save.'}
              </p>
            )}

            {canPromote && devEnv?.version_number && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-6 gap-1 text-[10px]"
                disabled={promoting === env}
                onClick={() => promote(env as 'staging' | 'production')}
              >
                {promoting === env ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <ArrowRight size={10} />
                )}
                {targetLabel}
              </Button>
            )}
          </div>
        );
      })}

      {/* Promotion history */}
      {promotions.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary"
          >
            <ChevronDown size={10} className={showHistory ? 'rotate-180' : ''} />
            {isPl ? 'Historia promocji' : 'Promotion history'}
          </button>

          {showHistory && (
            <div className="mt-2 flex flex-col gap-1">
              {promotions.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <span className="capitalize">{p.from_env}</span>
                  <ArrowRight size={8} />
                  <span className="capitalize">{p.to_env}</span>
                  <span className="ml-auto">
                    {new Date(p.promoted_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
