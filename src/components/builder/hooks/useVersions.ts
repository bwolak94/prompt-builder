import { useState, useCallback } from 'react';
import type { PromptVersionSummary, PromptVersion } from '@/db/repositories/version.repo';
import type { LineDiff } from '@/lib/diff';

export type VersionWithDiff = PromptVersion & {
  diff: LineDiff[];
  prevVersionNumber: number | null;
};

interface UseVersionsReturn {
  versions: PromptVersionSummary[];
  loading: boolean;
  creating: boolean;
  restoring: boolean;
  selectedVersion: VersionWithDiff | null;
  fetchVersions: (promptId: string) => Promise<void>;
  createVersion: (promptId: string, summary?: string) => Promise<void>;
  fetchVersion: (promptId: string, versionId: string, withDiff?: boolean) => Promise<void>;
  restoreVersion: (promptId: string, versionId: string) => Promise<void>;
  clearSelected: () => void;
}

export function useVersions(): UseVersionsReturn {
  const [versions, setVersions] = useState<PromptVersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionWithDiff | null>(null);

  const fetchVersions = useCallback(async (promptId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`);
      if (!res.ok) throw new Error('Failed to load versions');
      const data = (await res.json()) as PromptVersionSummary[];
      setVersions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createVersion = useCallback(async (promptId: string, summary?: string) => {
    setCreating(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to create version');
      }
      // Refresh the list
      await fetchVersions(promptId);
    } finally {
      setCreating(false);
    }
  }, [fetchVersions]);

  const fetchVersion = useCallback(async (promptId: string, versionId: string, withDiff = true) => {
    const qs = withDiff ? '?diff=true' : '';
    const res = await fetch(`/api/prompts/${promptId}/versions/${versionId}${qs}`);
    if (!res.ok) throw new Error('Failed to load version');
    const data = (await res.json()) as VersionWithDiff;
    setSelectedVersion(data);
  }, []);

  const restoreVersion = useCallback(async (promptId: string, versionId: string) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to restore version');
      }
      // Reload the page so the builder loads the restored prompt
      window.location.reload();
    } finally {
      setRestoring(false);
    }
  }, []);

  const clearSelected = useCallback(() => setSelectedVersion(null), []);

  return {
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
  };
}
