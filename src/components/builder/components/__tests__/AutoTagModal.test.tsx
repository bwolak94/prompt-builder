import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/services/auto-categorize.service', () => ({
  CATEGORIES: ['coding', 'writing', 'analysis'],
  DIFFICULTIES: ['beginner', 'intermediate', 'advanced'],
}));

import { AutoTagModal } from '../AutoTagModal';
import type { PromptSuggestion } from '@/lib/services/auto-categorize.service';

const SUGGESTION: PromptSuggestion = {
  category: 'coding',
  difficulty: 'intermediate',
  tags: ['python', 'api'],
};

const defaultProps = {
  open: true,
  suggestion: SUGGESTION,
  promptId: 'p1',
  lang: 'pl' as const,
  onApply: vi.fn(),
  onClose: vi.fn(),
};

describe('AutoTagModal — PL', () => {
  it('renders modal title', () => {
    render(<AutoTagModal {...defaultProps} />);
    expect(screen.getByText('Edytuj sugestie AI')).toBeTruthy();
  });

  it('renders existing tags', () => {
    render(<AutoTagModal {...defaultProps} />);
    expect(screen.getByText('python')).toBeTruthy();
    expect(screen.getByText('api')).toBeTruthy();
  });

  it('renders tag count', () => {
    render(<AutoTagModal {...defaultProps} />);
    expect(screen.getByText(/Tagi \(2\/5\)/)).toBeTruthy();
  });

  it('renders apply and cancel buttons', () => {
    render(<AutoTagModal {...defaultProps} />);
    expect(screen.getByText('Zastosuj')).toBeTruthy();
    expect(screen.getByText('Anuluj')).toBeTruthy();
  });

  it('removes a tag when X button clicked', () => {
    render(<AutoTagModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Remove tag python'));
    expect(screen.queryByText('python')).toBeFalsy();
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(<AutoTagModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Anuluj'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onApply and onClose when apply clicked', async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<AutoTagModal {...defaultProps} onApply={onApply} onClose={onClose} />);
    fireEvent.click(screen.getByText('Zastosuj'));
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ tags: expect.any(Array) }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('AutoTagModal — EN', () => {
  it('renders English title', () => {
    render(<AutoTagModal {...defaultProps} lang="en" />);
    expect(screen.getByText('Edit AI suggestions')).toBeTruthy();
  });

  it('renders English category label', () => {
    render(<AutoTagModal {...defaultProps} lang="en" />);
    expect(screen.getByText('Category')).toBeTruthy();
  });
});
