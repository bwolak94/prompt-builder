import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '../TemplateCard';
import type { SystemTemplate } from '@/db/repositories/template.repo';

const MOCK_TEMPLATE: SystemTemplate = {
  id: 't1',
  title: 'Asystent kodowania',
  title_en: 'Coding Assistant',
  description: 'Pomoc w programowaniu',
  description_en: 'Help with programming',
  category: 'coding',
  difficulty: 'beginner',
  tags: ['typescript', 'react'],
  blocks: [],
  variables: [],
  content_md: '',
  ai_score: 85,
  fork_count: 42,
  is_featured: true,
  order_index: 0,
  created_at: '2024-01-01T00:00:00Z',
};

describe('TemplateCard', () => {
  it('renders English title when lang=en', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="en" />);
    expect(screen.getByText('Coding Assistant')).toBeTruthy();
  });

  it('renders Polish title when lang=pl', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="pl" />);
    expect(screen.getByText('Asystent kodowania')).toBeTruthy();
  });

  it('falls back to Polish title when English title is null', () => {
    const t = { ...MOCK_TEMPLATE, title_en: null };
    render(<TemplateCard template={t} onFork={() => {}} lang="en" />);
    expect(screen.getByText('Asystent kodowania')).toBeTruthy();
  });

  it('shows difficulty badge', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="en" />);
    expect(screen.getByText('Beginner')).toBeTruthy();
  });

  it('shows "Featured" badge for featured templates', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="en" />);
    expect(screen.getByText(/Featured/i)).toBeTruthy();
  });

  it('does not show "Featured" badge for non-featured templates', () => {
    const t = { ...MOCK_TEMPLATE, is_featured: false };
    render(<TemplateCard template={t} onFork={() => {}} lang="en" />);
    expect(screen.queryByText(/Featured/i)).toBeNull();
  });

  it('shows ai_score', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="en" />);
    expect(screen.getByText('85/100')).toBeTruthy();
  });

  it('does not show ai_score when null', () => {
    const t = { ...MOCK_TEMPLATE, ai_score: null };
    render(<TemplateCard template={t} onFork={() => {}} lang="en" />);
    expect(screen.queryByText(/\/100/)).toBeNull();
  });

  it('shows fork count', () => {
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={() => {}} lang="en" />);
    expect(screen.getByText(/42/)).toBeTruthy();
  });

  it('renders up to 3 tags', () => {
    const t = { ...MOCK_TEMPLATE, tags: ['a', 'b', 'c', 'd'] };
    render(<TemplateCard template={t} onFork={() => {}} lang="en" />);
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('c')).toBeTruthy();
    expect(screen.queryByText('d')).toBeNull();
  });

  it('calls onFork with template id when use button is clicked', () => {
    const onFork = vi.fn();
    render(<TemplateCard template={MOCK_TEMPLATE} onFork={onFork} lang="en" />);
    // aria-label uses template.title (always PL title), not the localized title
    fireEvent.click(screen.getByRole('button', { name: /Use template: Asystent kodowania/i }));
    expect(onFork).toHaveBeenCalledWith('t1');
  });
});
