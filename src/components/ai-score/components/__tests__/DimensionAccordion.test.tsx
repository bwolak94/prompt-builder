import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DimensionAccordion } from '../DimensionAccordion';
import type { AIScoreFeedback } from '@/types';

const FEEDBACK: AIScoreFeedback = {
  clarity: { score: 85, comment: 'Very clear.', suggestions: ['Use simpler words'] },
  specificity: { score: 70, comment: 'Could be more specific.', suggestions: [] },
  structure: { score: 55, comment: 'Structure needs work.', suggestions: ['Add sections'] },
  tone: { score: 40, comment: 'Tone is inconsistent.', suggestions: [] },
  completeness: { score: 90, comment: 'Comprehensive.', suggestions: [] },
};

describe('DimensionAccordion', () => {
  it('renders all 5 dimension labels', () => {
    render(<DimensionAccordion feedback={FEEDBACK} />);
    expect(screen.getByText('Klarowność')).toBeTruthy();
    expect(screen.getByText('Szczegółowość')).toBeTruthy();
    expect(screen.getByText('Struktura')).toBeTruthy();
    expect(screen.getByText('Ton')).toBeTruthy();
    expect(screen.getByText('Kompletność')).toBeTruthy();
  });

  it('renders score badges for each dimension', () => {
    render(<DimensionAccordion feedback={FEEDBACK} />);
    expect(screen.getByText('85')).toBeTruthy();
    expect(screen.getByText('70')).toBeTruthy();
    expect(screen.getByText('90')).toBeTruthy();
  });

  it('renders dimension comments', () => {
    render(<DimensionAccordion feedback={FEEDBACK} />);
    expect(screen.getByText('Very clear.')).toBeTruthy();
    expect(screen.getByText('Could be more specific.')).toBeTruthy();
  });

  it('renders suggestions when present', () => {
    render(<DimensionAccordion feedback={FEEDBACK} />);
    expect(screen.getByText('Use simpler words')).toBeTruthy();
    expect(screen.getByText('Add sections')).toBeTruthy();
  });
});
