import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreferencesTab } from '../PreferencesTab';
import type { UserPreferences } from '@/types';

const PREFS: UserPreferences = {
  defaultModel: 'openai',
  language: 'pl',
};

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PreferencesTab', () => {
  it('renders AI provider label', () => {
    render(<PreferencesTab preferences={PREFS} />);
    expect(screen.getByText('Domyślny provider AI')).toBeTruthy();
  });

  it('renders language label', () => {
    render(<PreferencesTab preferences={PREFS} />);
    expect(screen.getByText('Język interfejsu')).toBeTruthy();
  });

  it('renders save button', () => {
    render(<PreferencesTab preferences={PREFS} />);
    expect(screen.getByText('Zapisz preferencje')).toBeTruthy();
  });

  it('calls PATCH /api/user/profile on save', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    render(<PreferencesTab preferences={PREFS} />);
    fireEvent.click(screen.getByText('Zapisz preferencje'));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/profile',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
  });

  it('shows "Zapisano!" after successful save', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    render(<PreferencesTab preferences={PREFS} />);
    fireEvent.click(screen.getByText('Zapisz preferencje'));
    await waitFor(() => expect(screen.getByText('Zapisano!')).toBeTruthy());
  });

  it('shows error message after failed save', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<PreferencesTab preferences={PREFS} />);
    fireEvent.click(screen.getByText('Zapisz preferencje'));
    await waitFor(() => expect(screen.getByText('Błąd zapisu')).toBeTruthy());
  });
});
