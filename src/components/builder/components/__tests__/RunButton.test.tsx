import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRun = vi.fn();
const mockCancel = vi.fn();
const mockReset = vi.fn();

let mockState: 'idle' | 'running' | 'done' | 'error' = 'idle';

vi.mock('../../hooks/useRunPrompt', () => ({
  useRunPrompt: () => ({
    state: mockState,
    output: '',
    error: null,
    creditsRemaining: null,
    run: mockRun,
    cancel: mockCancel,
    reset: mockReset,
  }),
}));

// Mock fetch for CreditsCounter (returns null data so it renders nothing)
const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockResolvedValue({ json: async () => ({ data: null }) });
  vi.stubGlobal('fetch', mockFetch);
  mockState = 'idle';
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ json: async () => ({ data: null }) });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { RunButton } from '../RunButton';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RunButton — idle state', () => {
  it('renders the run button', () => {
    render(<RunButton getPromptText={() => 'test prompt'} lang="en" />);
    expect(screen.getByRole('button', { name: /run prompt/i })).toBeTruthy();
  });

  it('calls run with prompt text when clicked', () => {
    render(<RunButton getPromptText={() => 'my prompt text'} lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: /run prompt/i }));
    expect(mockRun).toHaveBeenCalledWith(
      'my prompt text',
      expect.objectContaining({ provider: 'openai' }),
    );
  });

  it('does not call run when prompt text is empty', () => {
    render(<RunButton getPromptText={() => '   '} lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: /run prompt/i }));
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('RunButton — running state', () => {
  it('shows stop button when running', () => {
    mockState = 'running';
    render(<RunButton getPromptText={() => 'test'} lang="en" />);
    // t('run.cancel') = 'Stop' in English
    expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy();
  });

  it('calls cancel when stop button is clicked', () => {
    mockState = 'running';
    render(<RunButton getPromptText={() => 'test'} lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(mockCancel).toHaveBeenCalled();
  });
});
