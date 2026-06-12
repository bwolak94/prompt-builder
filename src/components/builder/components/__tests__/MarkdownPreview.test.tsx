import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockMarkdown = '';

vi.mock('../../hooks/useMarkdownGeneration', () => ({
  useMarkdownGeneration: () => mockMarkdown,
}));

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => {
    const state = { title: 'Test Prompt', isPublic: false, promptId: 'p1' };
    return selector(state);
  },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: vi.fn() }));
vi.mock('rehype-sanitize', () => ({ default: vi.fn() }));

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

import { MarkdownPreview } from '../MarkdownPreview';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MarkdownPreview', () => {
  it('shows empty state placeholder when no markdown', () => {
    mockMarkdown = '';
    render(<MarkdownPreview />);
    expect(screen.getByText('Podgląd pojawi się tutaj')).toBeTruthy();
  });

  it('renders markdown content when markdown is provided', () => {
    mockMarkdown = '# Hello World';
    render(<MarkdownPreview />);
    expect(screen.getByTestId('markdown')).toBeTruthy();
    expect(screen.getByTestId('markdown').textContent).toBe('# Hello World');
  });

  it('shows "Podgląd" label when markdown is present', () => {
    mockMarkdown = '## Some content';
    render(<MarkdownPreview />);
    expect(screen.getByText('Podgląd')).toBeTruthy();
  });

  it('renders export toolbar buttons when markdown is present', () => {
    mockMarkdown = 'Some prompt text';
    render(<MarkdownPreview />);
    expect(screen.getByLabelText('Kopiuj Markdown do schowka')).toBeTruthy();
    expect(screen.getByLabelText('Pobierz plik .md')).toBeTruthy();
  });
});
