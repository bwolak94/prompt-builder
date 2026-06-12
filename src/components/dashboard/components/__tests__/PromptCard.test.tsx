import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptCard } from '../PromptCard';
import type { Prompt } from '@/types';

// ── Clipboard mock ──────────────────────────────────────────────────────────

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const makePrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'p1',
  user_id: 'u1',
  title: 'My Test Prompt',
  description: 'A helpful prompt',
  blocks: [{ id: 'b1', section_slug: 'role', content: 'Act as…', order_index: 0 }],
  variables: [],
  content_md: '',
  tags: ['ai', 'assistant'],
  is_public: false,
  slug: null,
  fork_of: null,
  fork_count: 0,
  view_count: 0,
  category: null,
  difficulty: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PromptCard', () => {
  it('renders the prompt title', () => {
    render(<PromptCard prompt={makePrompt()} onDelete={() => {}} onFork={() => {}} />);
    expect(screen.getByText('My Test Prompt')).toBeTruthy();
  });

  it('shows "Bez tytułu" when title is empty', () => {
    render(<PromptCard prompt={makePrompt({ title: '' })} onDelete={() => {}} onFork={() => {}} />);
    expect(screen.getByText('Bez tytułu')).toBeTruthy();
  });

  it('renders description when present', () => {
    render(<PromptCard prompt={makePrompt()} onDelete={() => {}} onFork={() => {}} />);
    expect(screen.getByText('A helpful prompt')).toBeTruthy();
  });

  it('renders tags (up to 4)', () => {
    const prompt = makePrompt({ tags: ['a', 'b', 'c', 'd', 'e'] });
    render(<PromptCard prompt={prompt} onDelete={() => {}} onFork={() => {}} />);
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('d')).toBeTruthy();
    expect(screen.queryByText('e')).toBeNull();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('shows "Prywatny" badge for private prompts', () => {
    render(
      <PromptCard
        prompt={makePrompt({ is_public: false })}
        onDelete={() => {}}
        onFork={() => {}}
      />,
    );
    expect(screen.getByText('Prywatny')).toBeTruthy();
  });

  it('shows "Publiczny" badge for public prompts', () => {
    render(
      <PromptCard prompt={makePrompt({ is_public: true })} onDelete={() => {}} onFork={() => {}} />,
    );
    expect(screen.getByText('Publiczny')).toBeTruthy();
  });

  it('renders edit link pointing to builder', () => {
    render(<PromptCard prompt={makePrompt()} onDelete={() => {}} onFork={() => {}} />);
    const link = screen.getByLabelText(/Edytuj prompt: My Test Prompt/i) as HTMLAnchorElement;
    expect(link.href).toContain('/builder/p1');
  });

  it('calls onFork when duplicate button is clicked', () => {
    const onFork = vi.fn();
    render(<PromptCard prompt={makePrompt()} onDelete={() => {}} onFork={onFork} />);
    fireEvent.click(screen.getByLabelText('Duplikuj prompt'));
    expect(onFork).toHaveBeenCalledWith('p1');
  });

  it('shows share button for public prompts with slug', () => {
    render(
      <PromptCard
        prompt={makePrompt({ is_public: true, slug: 'my-test-prompt' })}
        onDelete={() => {}}
        onFork={() => {}}
      />,
    );
    expect(screen.getByLabelText('Kopiuj link do promptu')).toBeTruthy();
  });

  it('does not show share button for private prompts', () => {
    render(
      <PromptCard
        prompt={makePrompt({ is_public: false })}
        onDelete={() => {}}
        onFork={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Kopiuj link do promptu')).toBeNull();
  });

  it('shows block count in stats', () => {
    render(<PromptCard prompt={makePrompt()} onDelete={() => {}} onFork={() => {}} />);
    expect(screen.getByText('1 bloków')).toBeTruthy();
  });

  it('calls onDelete when delete is confirmed in dialog', async () => {
    const onDelete = vi.fn();
    render(<PromptCard prompt={makePrompt()} onDelete={onDelete} onFork={() => {}} />);

    // Open the delete dialog
    fireEvent.click(screen.getByLabelText(/Usuń prompt: My Test Prompt/i));

    await waitFor(() => {
      expect(screen.getByText('Usuń prompt')).toBeTruthy();
    });

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /^Usuń$/ }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });
});
