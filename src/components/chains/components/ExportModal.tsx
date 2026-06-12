import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2 } from 'lucide-react';

type ExportLang = 'python' | 'javascript';

interface ExportModalProps {
  open: boolean;
  chainId: string;
  isPl: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, chainId, isPl, onClose }) => {
  const [lang, setLang] = useState<ExportLang>('python');
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchExport = useCallback(
    async (l: ExportLang) => {
      setIsLoading(true);
      setCode(null);
      try {
        const res = await fetch(`/api/chains/${chainId}/export?lang=${l}`);
        if (res.ok) {
          const json = (await res.json()) as { data: { code: string } };
          setCode(json.data.code);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chainId],
  );

  const handleLangChange = (l: ExportLang) => {
    setLang(l);
    void fetchExport(l);
  };

  const handleOpen = (v: boolean) => {
    if (v && !code) void fetchExport(lang);
    if (!v) onClose();
  };

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isPl ? 'Eksportuj łańcuch' : 'Export chain'}</DialogTitle>
          <DialogDescription>
            {isPl
              ? 'Wygeneruj skrypt do uruchamiania łańcucha lokalnie'
              : 'Generate a script to run this chain locally'}
          </DialogDescription>
        </DialogHeader>

        {/* Language toggle */}
        <div className="flex gap-2">
          {(['python', 'javascript'] as ExportLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLangChange(l)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === l
                  ? 'bg-brand-500 text-white'
                  : 'border border-border text-text-secondary hover:bg-surface-raised'
              }`}
            >
              {l === 'python' ? 'Python' : 'Node.js (JS)'}
            </button>
          ))}
        </div>

        {/* Code area */}
        <div className="relative">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : code ? (
            <pre className="max-h-[400px] overflow-auto rounded-lg bg-surface-overlay p-4 text-xs text-text-secondary">
              <code>{code}</code>
            </pre>
          ) : null}

          {code && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="absolute right-3 top-3 gap-1.5"
            >
              {copied ? (
                <><Check size={12} /> {isPl ? 'Skopiowano' : 'Copied'}</>
              ) : (
                <><Copy size={12} /> {isPl ? 'Kopiuj' : 'Copy'}</>
              )}
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {isPl ? 'Zamknij' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
