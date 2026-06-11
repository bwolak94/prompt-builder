import React, { useEffect, useState } from 'react';
import { useI18n, type Lang } from '@/lib/i18n';
import type { RunCreditsStatus } from '@/db/repositories/run-credits.repo';

interface CreditsCounterProps {
  lang: Lang;
  /** Override from live run events */
  liveRemaining?: number | null;
}

export const CreditsCounter: React.FC<CreditsCounterProps> = ({ lang, liveRemaining }) => {
  const { t } = useI18n(lang);
  const [status, setStatus] = useState<RunCreditsStatus | null>(null);

  useEffect(() => {
    fetch('/api/run/credits')
      .then((r) => r.json())
      .then((json: { data?: RunCreditsStatus }) => {
        if (json.data) setStatus(json.data);
      })
      .catch(() => {}); // non-critical
  }, []);

  if (!status) return null;

  // Unlimited plan
  if (status.monthlyLimit === -1) {
    return (
      <span className="text-xs text-muted-foreground">{t('run.creditsUnlimited')}</span>
    );
  }

  const remaining = liveRemaining ?? status.remaining;
  const used = status.monthlyLimit - remaining;
  const pct = Math.min(100, (used / status.monthlyLimit) * 100);
  const isLow = remaining <= 5;

  return (
    <div className="flex items-center gap-2" title={`${used} / ${status.monthlyLimit} ${t('run.creditsThisMonth')}`}>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs tabular-nums ${isLow ? 'text-destructive' : 'text-muted-foreground'}`}>
        {remaining}/{status.monthlyLimit}
      </span>
    </div>
  );
};
