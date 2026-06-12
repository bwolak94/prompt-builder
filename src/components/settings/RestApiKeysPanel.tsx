import React, { useState, useCallback, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiKey {
  id: string;
  key_prefix: string;
  key_suffix: string;
  label: string;
  rate_limit: number;
  last_used_at: string | null;
  request_count: number;
  created_at: string;
}

interface RestApiKeysPanelProps {
  lang?: 'pl' | 'en';
}

export const RestApiKeysPanel: React.FC<RestApiKeysPanelProps> = ({ lang = 'pl' }) => {
  const isPl = lang === 'pl';
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/rest-api-keys');
      if (res.ok) {
        const json = await res.json() as { data: ApiKey[] };
        setKeys(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/settings/rest-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      if (res.ok) {
        const json = await res.json() as { data: ApiKey & { plaintext_key: string } };
        setNewKey(json.data.plaintext_key);
        setNewLabel('');
        setShowCreate(false);
        await fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/settings/rest-api-keys/${id}`, { method: 'DELETE' });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Key size={16} className="text-brand-400" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {isPl ? 'Klucze REST API' : 'REST API Keys'}
          </h3>
          <p className="text-xs text-text-muted">
            {isPl ? 'Zarządzaj promptami programatycznie (max 5 kluczy)' : 'Manage prompts programmatically (max 5 keys)'}
          </p>
        </div>
      </div>

      {/* One-time key display */}
      {newKey && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle size={14} />
            <p className="text-xs font-semibold">
              {isPl ? 'Zapisz ten klucz! Nie możemy pokazać go ponownie.' : 'Save this key — we cannot show it again.'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded bg-surface-overlay px-2 py-1 font-mono text-xs text-text-primary break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-md border border-border p-1.5 text-text-muted hover:text-text-primary"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-[10px] text-text-muted underline"
          >
            {isPl ? 'Rozumiem, zamknij' : 'I understand, close'}
          </button>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 size={14} className="animate-spin" />
          {isPl ? 'Ładowanie…' : 'Loading…'}
        </div>
      ) : keys.length === 0 ? (
        <p className="text-xs text-text-muted">
          {isPl ? 'Brak kluczy API.' : 'No API keys yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary">{key.label}</p>
                <p className="font-mono text-[10px] text-text-muted">
                  {key.key_prefix}…{key.key_suffix}
                </p>
              </div>
              <span className="text-[10px] text-text-muted">
                {key.request_count}/{key.rate_limit} {isPl ? 'req/dzień' : 'req/day'}
              </span>
              <button
                onClick={() => deleteKey(key.id)}
                disabled={deletingId === key.id}
                className="shrink-0 rounded-md p-1 text-text-muted hover:text-red-400 disabled:opacity-50"
                aria-label={isPl ? `Usuń klucz ${key.label}` : `Delete key ${key.label}`}
              >
                {deletingId === key.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
            placeholder={isPl ? 'np. "My App"' : 'e.g. "My App"'}
            className="flex-1 rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
          <Button size="sm" className="h-7 text-xs" onClick={createKey} disabled={creating || !newLabel.trim()}>
            {creating ? <Loader2 size={12} className="animate-spin" /> : (isPl ? 'Generuj' : 'Generate')}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreate(false)}>
            {isPl ? 'Anuluj' : 'Cancel'}
          </Button>
        </div>
      ) : (
        keys.length < 5 && (
          <Button
            size="sm"
            variant="outline"
            className="w-fit gap-1.5 text-xs"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={12} />
            {isPl ? 'Nowy klucz' : 'New key'}
          </Button>
        )
      )}

      <div className="rounded-lg border border-border bg-surface-raised p-3">
        <p className="text-[10px] font-medium text-text-muted mb-1">
          {isPl ? 'Przykład użycia:' : 'Usage example:'}
        </p>
        <pre className="overflow-x-auto font-mono text-[10px] text-text-secondary whitespace-pre">
{`curl -H "Authorization: Bearer pb_live_..." \\
     https://promptbase.app/api/v1/prompts`}
        </pre>
      </div>
    </div>
  );
};
