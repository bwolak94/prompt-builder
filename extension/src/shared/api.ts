// Shared PromptBase API client for the extension.
// All requests use credentials:'include' so the user's browser session cookie
// is sent automatically when logged into PromptBase.

export interface PromptEntry {
  id: string;
  title: string;
  content_md: string;
  tags: string[];
  is_public: boolean;
  updated_at: string;
}

export interface ImportedBlock {
  section_slug: string;
  content: string;
}

export interface ParseResult {
  title: string;
  blocks: ImportedBlock[];
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const DEFAULT_HOST = 'http://localhost:3000';

export async function getHost(): Promise<string> {
  const result = await chrome.storage.sync.get(['host']);
  return (result['host'] as string | undefined) ?? DEFAULT_HOST;
}

export async function setHost(host: string): Promise<void> {
  await chrome.storage.sync.set({ host });
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const host = await getHost();
  try {
    const res = await fetch(`${host}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.status === 401) return { ok: false, error: 'unauthenticated' };

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
    }

    return { ok: true, data: (json as { data: T }).data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function getPrompts(limit = 20): Promise<PromptEntry[]> {
  const result = await apiFetch<PromptEntry[]>(`/api/prompts`);
  if (!result.ok) return [];
  return result.data.slice(0, limit);
}

export async function createPrompt(data: {
  title: string;
  content_md?: string;
  blocks: ImportedBlock[];
  tags?: string[];
}): Promise<{ id: string } | null> {
  const blocks = data.blocks.map((b, i) => ({
    id: crypto.randomUUID(),
    section_slug: b.section_slug,
    content: b.content,
    order_index: i,
  }));

  const result = await apiFetch<{ id: string }>('/api/prompts', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      blocks,
      variables: [],
      tags: data.tags ?? [],
      is_public: false,
    }),
  });

  return result.ok ? result.data : null;
}

export async function parseText(text: string): Promise<ParseResult | null> {
  const result = await apiFetch<ParseResult>('/api/import/parse', {
    method: 'POST',
    body: JSON.stringify({ text, mode: 'heuristic' }),
  });
  return result.ok ? result.data : null;
}

export async function checkAuth(): Promise<boolean> {
  const result = await apiFetch<unknown>('/api/prompts');
  return result.ok;
}
