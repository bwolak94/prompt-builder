import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockSetVariable = vi.fn();
let mockDetectedVariables: unknown[] = [];
let mockVariables: Record<string, string> = {};

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => {
    const state = {
      detectedVariables: mockDetectedVariables,
      variables: mockVariables,
      setVariable: mockSetVariable,
    };
    return selector(state);
  },
}));

import { VariableForm } from '../VariableForm';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VariableForm — no variables', () => {
  it('shows empty state hint when no variables detected', () => {
    mockDetectedVariables = [];
    render(<VariableForm />);
    expect(screen.getByText(/Użyj/)).toBeTruthy();
    expect(screen.getByText('{{nazwa_zmiennej}}')).toBeTruthy();
  });
});

describe('VariableForm — with variables', () => {
  it('renders "Zmienne" header', () => {
    mockDetectedVariables = [{ name: 'lang', label: 'Lang', type: 'text', defaultValue: '' }];
    mockVariables = { lang: 'en' };
    render(<VariableForm />);
    expect(screen.getByText('Zmienne')).toBeTruthy();
  });

  it('renders a field for each detected variable', () => {
    mockDetectedVariables = [
      { name: 'lang', label: 'Language', type: 'text', defaultValue: '' },
      { name: 'tone', label: 'Tone', type: 'text', defaultValue: '' },
    ];
    mockVariables = { lang: '', tone: '' };
    render(<VariableForm />);
    expect(screen.getByLabelText('Language')).toBeTruthy();
    expect(screen.getByLabelText('Tone')).toBeTruthy();
  });
});
