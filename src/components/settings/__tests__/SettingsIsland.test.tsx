import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Tabs to render content directly (avoid Radix interactions)
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  // Settings sub-panels fetch data on mount; return empty responses
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: [] }),
  });
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { SettingsIsland } from '../SettingsIsland';
import type { ProfileData } from '@/lib/services/profile.service';

const PROFILE: ProfileData = {
  id: 'u1',
  display_name: 'Jan Kowalski',
  username: null,
  bio: 'Developer',
  avatar_url: null,
  preferences: {
    defaultModel: 'openai',
    language: 'pl',
  },
};

describe('SettingsIsland — PL', () => {
  it('renders settings heading', () => {
    render(<SettingsIsland profile={PROFILE} email="jan@example.com" lang="pl" />);
    expect(screen.getByText('Ustawienia')).toBeTruthy();
  });

  it('renders all 5 tab buttons', () => {
    render(<SettingsIsland profile={PROFILE} email="jan@example.com" lang="pl" />);
    expect(screen.getByText('Profil')).toBeTruthy();
    expect(screen.getByText('Preferencje')).toBeTruthy();
    expect(screen.getByText('Konto')).toBeTruthy();
    expect(screen.getByText('API')).toBeTruthy();
    expect(screen.getByText('Integracje')).toBeTruthy();
  });

  it('renders profile tab content', () => {
    render(<SettingsIsland profile={PROFILE} email="jan@example.com" lang="pl" />);
    expect(screen.getByDisplayValue('Jan Kowalski')).toBeTruthy();
  });
});

describe('SettingsIsland — EN', () => {
  it('renders English heading', () => {
    render(<SettingsIsland profile={PROFILE} email="jan@example.com" lang="en" />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders English tab labels', () => {
    render(<SettingsIsland profile={PROFILE} email="jan@example.com" lang="en" />);
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Preferences')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Integrations')).toBeTruthy();
  });
});
