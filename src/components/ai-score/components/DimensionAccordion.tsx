import React from 'react';
import { Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AIScoreFeedback } from '@/types';

const DIMENSION_LABELS: Record<keyof AIScoreFeedback, string> = {
  clarity:      'Klarowność',
  specificity:  'Szczegółowość',
  structure:    'Struktura',
  tone:         'Ton',
  completeness: 'Kompletność',
};

function scoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-400';
  if (score >= 60) return 'bg-lime-500/10 text-lime-400';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400';
  return 'bg-red-500/10 text-red-400';
}

interface DimensionAccordionProps {
  feedback: AIScoreFeedback;
}

export const DimensionAccordion: React.FC<DimensionAccordionProps> = ({ feedback }) => (
  <Accordion type="multiple" className="flex flex-col gap-1">
    {(Object.keys(DIMENSION_LABELS) as Array<keyof AIScoreFeedback>).map((key) => {
      const dim = feedback[key];
      const label = DIMENSION_LABELS[key];
      return (
        <AccordionItem
          key={key}
          value={key}
          className="rounded-lg border border-border bg-surface-raised px-3"
        >
          <AccordionTrigger className="py-2 text-xs hover:no-underline">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreBadgeColor(dim.score)}`}
              >
                {dim.score}
              </span>
              <span className="font-medium text-text-primary">{label}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 text-xs">
            <p className="text-text-secondary">{dim.comment}</p>
            {dim.suggestions.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {dim.suggestions.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-text-muted">
                    <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      );
    })}
  </Accordion>
);
