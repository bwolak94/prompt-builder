import React from 'react';
import { GitFork, Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SystemTemplate } from '@/db/repositories/template.repo';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-400',
  advanced: 'bg-red-500/10 text-red-400',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Początkujący',
  intermediate: 'Średni',
  advanced: 'Zaawansowany',
};

interface TemplateCardProps {
  template: SystemTemplate;
  onFork: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onFork }) => (
  <article className="group relative flex flex-col rounded-xl border border-border bg-surface-raised p-4 transition-all hover:border-brand-500/40 hover:shadow-sm">
    {/* Header */}
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="flex flex-wrap gap-1">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[template.difficulty] ?? ''}`}
        >
          {DIFFICULTY_LABELS[template.difficulty] ?? template.difficulty}
        </span>
        {template.is_featured && (
          <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400">
            ⭐ Polecany
          </span>
        )}
      </div>
      {template.ai_score !== null && (
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Star size={10} className="text-amber-400" aria-hidden="true" />
          {template.ai_score}/100
        </div>
      )}
    </div>

    {/* Title */}
    <h2 className="mb-1 text-sm font-semibold text-text-primary">{template.title}</h2>
    <p className="line-clamp-2 text-xs text-text-muted">{template.description}</p>

    {/* Tags */}
    {template.tags.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1">
        {template.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    )}

    {/* Footer */}
    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <GitFork size={11} aria-hidden="true" />
        {template.fork_count} forków
      </span>

      {/* "Fork this" CTA — visible on hover */}
      <button
        onClick={() => onFork(template.id)}
        className="flex translate-x-2 items-center gap-1 rounded-md bg-brand-500 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
        aria-label={`Użyj szablonu: ${template.title}`}
      >
        Użyj szablonu <ChevronRight size={12} aria-hidden="true" />
      </button>
    </div>
  </article>
);

// Loading skeleton
export const TemplateCardSkeleton: React.FC = () => (
  <div className="flex animate-pulse flex-col rounded-xl border border-border bg-surface-raised p-4">
    <div className="mb-3 flex gap-2">
      <div className="h-4 w-20 rounded-full bg-surface-overlay" />
    </div>
    <div className="mb-2 h-4 w-3/4 rounded bg-surface-overlay" />
    <div className="h-3 w-full rounded bg-surface-overlay" />
    <div className="mt-1 h-3 w-2/3 rounded bg-surface-overlay" />
    <div className="mt-4 flex gap-1 border-t border-border pt-3">
      <div className="h-3 w-16 rounded bg-surface-overlay" />
    </div>
  </div>
);
