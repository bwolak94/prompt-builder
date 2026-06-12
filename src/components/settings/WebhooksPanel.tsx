import React, { useState, useCallback, useEffect } from 'react';
import { Webhook, Plus, Trash2, Send, Loader2, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type WebhookType = 'generic' | 'slack' | 'discord';
type WebhookEvent =
  | 'prompt.forked'
  | 'prompt.commented'
  | 'prompt.rated'
  | 'prompt.score_ready'
  | 'challenge.won';

interface WebhookItem {
  id: string;
  type: WebhookType;
  label: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
}

interface Delivery {
  id: string;
  event_type: string;
  status_code: number | null;
  attempt: number;
  delivered_at: string;
  error: string | null;
}

interface WebhooksPanelProps {
  lang?: 'pl' | 'en';
}

const ALL_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'prompt.forked',       label: 'Prompt forked' },
  { value: 'prompt.commented',    label: 'New comment' },
  { value: 'prompt.rated',        label: 'New rating' },
  { value: 'prompt.score_ready',  label: 'AI score ready' },
  { value: 'challenge.won',       label: 'Challenge won' },
];

export const WebhooksPanel: React.FC<WebhooksPanelProps> = ({ lang = 'pl' }) => {
  const isPl = lang === 'pl';
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedDeliveries, setExpandedDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    type: 'generic' as WebhookType,
    label: '',
    url: '',
    events: [] as WebhookEvent[],
    secret: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const json = await res.json() as { data: WebhookItem[] };
        setWebhooks(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const createWebhook = async () => {
    if (!form.label || !form.url || form.events.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          label: form.label,
          url: form.url,
          events: form.events,
          secret: form.secret || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ type: 'generic', label: '', url: '', events: [], secret: '' });
        await fetchWebhooks();
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const testWebhook = async (id: string) => {
    setTestingId(id);
    try {
      await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
    } finally {
      setTestingId(null);
    }
  };

  const loadDeliveries = async (id: string) => {
    if (expandedDeliveries === id) {
      setExpandedDeliveries(null);
      return;
    }
    setExpandedDeliveries(id);
    if (!deliveries[id]) {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      if (res.ok) {
        const json = await res.json() as { data: Delivery[] };
        setDeliveries((prev) => ({ ...prev, [id]: json.data }));
      }
    }
  };

  const toggleEvent = (event: WebhookEvent) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Webhook size={16} className="text-brand-400" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {isPl ? 'Integracje (Webhooks)' : 'Integrations (Webhooks)'}
          </h3>
          <p className="text-xs text-text-muted">
            {isPl ? 'Otrzymuj powiadomienia o zdarzeniach w swoich serwisach' : 'Receive event notifications in your services'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 size={14} className="animate-spin" /> {isPl ? 'Ładowanie…' : 'Loading…'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg border border-border bg-surface-raised">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">{wh.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      wh.type === 'slack' ? 'bg-purple-500/10 text-purple-400' :
                      wh.type === 'discord' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-surface-overlay text-text-muted'
                    }`}>
                      {wh.type}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${wh.is_active ? 'bg-green-400' : 'bg-text-muted'}`} />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-text-muted">{wh.url}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => testWebhook(wh.id)}
                    disabled={testingId === wh.id}
                    title={isPl ? 'Wyślij testowy event' : 'Send test event'}
                    className="rounded-md p-1 text-text-muted hover:text-brand-400 disabled:opacity-50"
                  >
                    {testingId === wh.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  </button>
                  <button
                    onClick={() => loadDeliveries(wh.id)}
                    title={isPl ? 'Historia wysłań' : 'Delivery log'}
                    className="rounded-md p-1 text-text-muted hover:text-text-primary"
                  >
                    <ChevronDown size={12} className={expandedDeliveries === wh.id ? 'rotate-180' : ''} />
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="rounded-md p-1 text-text-muted hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Delivery log */}
              {expandedDeliveries === wh.id && (
                <div className="border-t border-border px-3 py-2">
                  {(deliveries[wh.id] ?? []).length === 0 ? (
                    <p className="text-[10px] text-text-muted">{isPl ? 'Brak wysłań.' : 'No deliveries.'}</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {(deliveries[wh.id] ?? []).slice(0, 10).map((d) => (
                        <div key={d.id} className="flex items-center gap-2 text-[10px]">
                          {d.error || !d.status_code || d.status_code >= 400 ? (
                            <XCircle size={10} className="text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 size={10} className="text-green-400 shrink-0" />
                          )}
                          <span className="text-text-muted">{d.event_type}</span>
                          <span className="text-text-muted">{d.status_code ?? '—'}</span>
                          <span className="ml-auto text-text-muted">
                            {new Date(d.delivered_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg border border-brand-500/30 bg-surface-raised p-4">
          <p className="mb-3 text-xs font-semibold text-text-primary">
            {isPl ? 'Nowa integracja' : 'New integration'}
          </p>

          <div className="flex flex-col gap-2">
            {/* Type */}
            <div className="flex gap-2">
              {(['generic', 'slack', 'discord'] as WebhookType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`rounded-md border px-2 py-1 text-xs capitalize transition-colors ${
                    form.type === t
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-border text-text-muted hover:border-brand-500/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder={isPl ? 'Etykieta (np. "Slack Dev")' : 'Label (e.g. "Slack Dev")'}
              className="rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className="rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            {form.type === 'generic' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.secret}
                  onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                  placeholder="HMAC Secret (optional)"
                  className="flex-1 rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, secret: generateSecret() }))}
                  className="shrink-0 text-[10px] text-brand-400 hover:underline"
                >
                  {isPl ? 'Generuj' : 'Generate'}
                </button>
              </div>
            )}

            {/* Events */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev.value}
                  onClick={() => toggleEvent(ev.value)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                    form.events.includes(ev.value)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-border text-text-muted hover:border-brand-500/50'
                  }`}
                >
                  {ev.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={createWebhook} disabled={creating || !form.label || !form.url || form.events.length === 0}>
                {creating ? <Loader2 size={12} className="animate-spin" /> : (isPl ? 'Zapisz' : 'Save')}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreate(false)}>
                {isPl ? 'Anuluj' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showCreate && (
        <Button size="sm" variant="outline" className="w-fit gap-1.5 text-xs" onClick={() => setShowCreate(true)}>
          <Plus size={12} />
          {isPl ? 'Dodaj integrację' : 'Add integration'}
        </Button>
      )}
    </div>
  );
};
