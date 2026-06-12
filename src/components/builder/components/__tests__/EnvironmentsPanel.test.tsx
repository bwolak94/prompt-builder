import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockPromptId: string | null = null;

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => selector({ promptId: mockPromptId }),
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  mockPromptId = null;
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { EnvironmentsPanel } from '../EnvironmentsPanel';

describe('EnvironmentsPanel — no promptId', () => {
  it('shows save-first message', () => {
    render(<EnvironmentsPanel />);
    expect(screen.getByText(/Zapisz prompt/)).toBeTruthy();
  });
});

describe('EnvironmentsPanel — with promptId', () => {
  beforeEach(() => {
    mockPromptId = 'prompt-123';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          environments: [
            {
              id: 'e1',
              environment: 'dev',
              version_number: 3,
              promoted_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'e2',
              environment: 'staging',
              version_number: 2,
              promoted_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'e3',
              environment: 'production',
              version_number: 1,
              promoted_at: '2024-01-01T00:00:00Z',
            },
          ],
          promotions: [],
        },
      }),
    });
  });

  it('renders all three environment cards', async () => {
    render(<EnvironmentsPanel />);
    await screen.findByText('Development');
    expect(screen.getByText('Staging')).toBeTruthy();
    expect(screen.getByText('Production')).toBeTruthy();
  });

  it('shows version numbers', async () => {
    render(<EnvironmentsPanel />);
    await screen.findByText('v3');
    expect(screen.getByText('v2')).toBeTruthy();
    expect(screen.getByText('v1')).toBeTruthy();
  });

  it('shows header label', async () => {
    render(<EnvironmentsPanel />);
    await screen.findByText('Środowiska');
  });

  it('renders EN labels when lang="en"', async () => {
    render(<EnvironmentsPanel lang="en" />);
    await screen.findByText('Environments');
  });
});
