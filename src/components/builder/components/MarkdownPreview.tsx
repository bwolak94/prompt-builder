import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useMarkdownGeneration } from '../hooks/useMarkdownGeneration';
import type { Components } from 'react-markdown';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

// ── Shiki dynamic import ──────────────────────────────────────────────────────

type ShikiHighlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

let highlighterPromise: Promise<ShikiHighlighter> | null = null;

async function getHighlighter(): Promise<ShikiHighlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark-dimmed', 'github-light'],
        langs: ['javascript', 'typescript', 'python', 'bash', 'json', 'markdown', 'sql'],
      }),
    ) as Promise<ShikiHighlighter>;
  }
  return highlighterPromise!;
}

// ── Code block with shiki ─────────────────────────────────────────────────────

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeProps> = ({ inline, className, children }) => {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const lang = className?.replace('language-', '') ?? 'text';
  const code = String(children ?? '').replace(/\n$/, '');

  useEffect(() => {
    if (inline || !code) return;

    let cancelled = false;
    getHighlighter().then((hl) => {
      if (cancelled) return;
      try {
        const html = hl.codeToHtml(code, {
          lang,
          theme: 'github-dark-dimmed' as BundledTheme,
        });
        if (!cancelled) setHighlighted(html);
      } catch {
        // fallback: leave null
      }
    });

    return () => { cancelled = true; };
  }, [code, lang, inline]);

  if (inline) {
    return <code className="rounded bg-surface-1 px-1 py-0.5 font-mono text-xs text-text-primary">{children}</code>;
  }

  if (!highlighted) {
    // Skeleton while shiki loads
    return (
      <pre className="overflow-x-auto rounded-lg bg-surface-1 p-4">
        <code className="font-mono text-xs text-text-muted">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg text-xs [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

// ── rehype sanitize config ────────────────────────────────────────────────────

const sanitizeOptions = {
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'ul', 'ol', 'li', 'blockquote',
    'strong', 'em', 'del', 'code', 'pre',
    'a', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  attributes: {
    '*': ['className'],
    a: ['href', 'title', 'target', 'rel'],
  },
};

// ── Export toolbar ────────────────────────────────────────────────────────────

import { Copy, Check, Download, Link } from 'lucide-react';

function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'prompt';
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

const ExportToolbar: React.FC<{ markdown: string }> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  const title = useBuilderStore((s) => s.title);
  const isPublic = useBuilderStore((s) => s.isPublic);
  const promptId = useBuilderStore((s) => s.promptId);

  const handleCopy = async () => {
    await copyToClipboard(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugifyTitle(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    if (!promptId) return;
    const url = `${window.location.origin}/builder/${promptId}`;
    await copyToClipboard(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopy}
        aria-label="Kopiuj Markdown do schowka"
        title="Kopiuj Markdown"
        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
      <button
        onClick={handleDownload}
        aria-label="Pobierz plik .md"
        title="Pobierz .md"
        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        <Download size={13} />
      </button>
      {promptId && (
        <button
          onClick={handleShareLink}
          aria-label="Kopiuj link do promptu"
          title={isPublic ? 'Kopiuj link publiczny' : 'Kopiuj link (prywatny)'}
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          {linkCopied ? <Check size={13} className="text-emerald-400" /> : <Link size={13} />}
        </button>
      )}
    </div>
  );
};

// ── MarkdownPreview ───────────────────────────────────────────────────────────

const mdComponents: Components = {
  code: CodeBlock as Components['code'],
};

import { useBuilderStore } from '../store/builder.store';

export const MarkdownPreview: React.FC = () => {
  const markdown = useMarkdownGeneration();

  if (!markdown) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-xs text-text-muted">Podgląd pojawi się tutaj</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Podgląd</p>
        <ExportToolbar markdown={markdown} />
      </div>
      <div
        className={[
          'max-h-[calc(100vh-16rem)] overflow-y-auto rounded-lg border border-border bg-surface-1 p-4',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border',
        ].join(' ')}
      >
        <div
          className={[
            'prose prose-invert max-w-none text-xs',
            'prose-headings:text-text-primary prose-p:text-text-secondary',
            'prose-strong:text-text-primary prose-code:text-amber-300',
            'prose-hr:border-border prose-blockquote:border-brand-500',
          ].join(' ')}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSanitize, sanitizeOptions]]}
            components={mdComponents}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
