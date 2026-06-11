import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useVersions } from '../hooks/useVersions';
import { useBuilderStore } from '../store/builder.store';
import { useI18n, type Lang } from '@/lib/i18n';
import type { PromptVersionSummary } from '@/db/repositories/version.repo';
import type { LineDiff } from '@/lib/diff';

interface VersionsPanelProps {
  lang?: Lang;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({ lang = 'pl' }) => {
  const { t } = useI18n(lang);
  const promptId = useBuilderStore((s) => s.promptId);

  const {
    versions,
    loading,
    creating,
    restoring,
    selectedVersion,
    fetchVersions,
    createVersion,
    fetchVersion,
    restoreVersion,
    clearSelected,
  } = useVersions();

  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [summaryInput, setSummaryInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (promptId) {
      void fetchVersions(promptId);
    }
  }, [promptId, fetchVersions]);

  const handleCreate = async () => {
    if (!promptId) return;
    await createVersion(promptId, summaryInput.trim() || undefined);
    setSummaryInput('');
    setShowCreateDialog(false);
  };

  const handleSelectVersion = async (v: PromptVersionSummary) => {
    if (!promptId) return;
    await fetchVersion(promptId, v.id, true);
  };

  const handleRestore = async () => {
    if (!promptId || !confirmRestore) return;
    await restoreVersion(promptId, confirmRestore);
    setConfirmRestore(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('versions.title')}</h3>
        <Button
          size="sm"
          variant="outline"
          disabled={!promptId || creating}
          onClick={() => setShowCreateDialog(true)}
        >
          {creating ? t('versions.creating') : t('versions.create')}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-xs">{t('common.loading')}</p>
      ) : versions.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('versions.empty')}</p>
      ) : (
        <ScrollArea className="h-[420px] pr-2">
          <ul className="flex flex-col gap-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="hover:bg-accent/50 cursor-pointer rounded-md border border-border p-2 transition-colors"
                onClick={() => void handleSelectVersion(v)}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    v{v.version_number}
                  </Badge>
                  <span className="text-muted-foreground truncate text-xs">{formatDate(v.created_at)}</span>
                </div>
                {v.change_summary && (
                  <p className="mt-1 truncate text-xs">{v.change_summary}</p>
                )}
                {!v.change_summary && (
                  <p className="text-muted-foreground mt-1 truncate text-xs">{v.title}</p>
                )}
                <p className="text-muted-foreground mt-0.5 truncate text-xs opacity-70">{v.preview}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      {/* Diff modal */}
      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && clearSelected()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVersion ? `v${selectedVersion.version_number} — ${selectedVersion.title}` : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.change_summary ?? t('versions.noSummary')}
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <ScrollArea className="h-[400px] rounded border border-border bg-muted/30 p-2">
              <DiffView diff={selectedVersion.diff} />
            </ScrollArea>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={clearSelected}>
              {t('common.close')}
            </Button>
            {selectedVersion && (
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmRestore(selectedVersion.id);
                  clearSelected();
                }}
              >
                {t('versions.restore')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirm modal */}
      <Dialog open={!!confirmRestore} onOpenChange={(open) => !open && setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('versions.restoreConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('versions.restoreConfirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmRestore(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" disabled={restoring} onClick={() => void handleRestore()}>
              {restoring ? t('versions.restoring') : t('versions.restoreConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create version dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('versions.createTitle')}</DialogTitle>
            <DialogDescription>{t('versions.createDesc')}</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder={t('versions.summaryPlaceholder')}
            value={summaryInput}
            maxLength={200}
            onChange={(e) => setSummaryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button disabled={creating} onClick={() => void handleCreate()}>
              {creating ? t('versions.creating') : t('versions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Diff renderer ─────────────────────────────────────────────────────────────

interface DiffViewProps {
  diff: LineDiff[];
}

const DiffView: React.FC<DiffViewProps> = ({ diff }) => {
  if (diff.length === 0) return <p className="text-muted-foreground p-2 text-xs">No changes.</p>;

  return (
    <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-all">
      {diff.map((entry, i) => (
        <span
          key={i}
          className={
            entry.type === 'added'
              ? 'block bg-green-500/10 text-green-700 dark:text-green-400'
              : entry.type === 'removed'
                ? 'block bg-red-500/10 text-red-700 dark:text-red-400'
                : 'block text-foreground/70'
          }
        >
          {entry.type === 'added' ? '+ ' : entry.type === 'removed' ? '- ' : '  '}
          {entry.line}
        </span>
      ))}
    </pre>
  );
};
