import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileTab } from '../ProfileTab';
import type { ProfileData } from '@/lib/services/profile.service';

const PROFILE: ProfileData = {
  id: 'u1',
  display_name: 'Alice',
  username: 'alice',
  bio: 'Full-stack dev',
  avatar_url: null,
  preferences: { defaultModel: 'openai', language: 'pl' },
};

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProfileTab', () => {
  it('renders the display name input prefilled', () => {
    render(<ProfileTab profile={PROFILE} />);
    expect((screen.getByLabelText('Wyświetlana nazwa') as HTMLInputElement).value).toBe('Alice');
  });

  it('renders username input prefilled', () => {
    render(<ProfileTab profile={PROFILE} />);
    expect((screen.getByLabelText('Nazwa użytkownika') as HTMLInputElement).value).toBe('alice');
  });

  it('renders bio textarea prefilled', () => {
    render(<ProfileTab profile={PROFILE} />);
    expect((screen.getByLabelText('Bio') as HTMLTextAreaElement).value).toBe('Full-stack dev');
  });

  it('shows avatar initial when no avatar_url', () => {
    render(<ProfileTab profile={PROFILE} />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('shows avatar image when avatar_url is set', () => {
    const p = { ...PROFILE, avatar_url: 'https://example.com/avatar.jpg' };
    render(<ProfileTab profile={p} />);
    const img = screen.getByAltText('Avatar') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/avatar.jpg');
  });

  it('renders save button', () => {
    render(<ProfileTab profile={PROFILE} />);
    expect(screen.getByText('Zapisz profil')).toBeTruthy();
  });

  it('shows error when file is not an image', () => {
    render(<ProfileTab profile={PROFILE} />);
    const input = screen.getByLabelText('Wybierz avatar') as HTMLInputElement;
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('Plik musi być obrazem.')).toBeTruthy();
  });

  it('calls PATCH /api/user/profile on save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<ProfileTab profile={PROFILE} />);
    fireEvent.click(screen.getByText('Zapisz profil'));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/profile',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
  });

  it('shows "Zapisano!" after successful save', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<ProfileTab profile={PROFILE} />);
    fireEvent.click(screen.getByText('Zapisz profil'));
    await waitFor(() => expect(screen.getByText('Zapisano!')).toBeTruthy());
  });
});
