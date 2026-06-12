import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CreditsCounter } from '../CreditsCounter';

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CreditsCounter', () => {
  it('renders nothing while loading (no status yet)', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<CreditsCounter lang="en" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders unlimited label when monthlyLimit is -1', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { monthlyLimit: -1, remaining: -1, used: 0 } }),
    });
    render(<CreditsCounter lang="en" />);
    await waitFor(() => {
      expect(screen.getByText(/unlimited/i)).toBeTruthy();
    });
  });

  it('renders progress bar and remaining count', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { monthlyLimit: 20, remaining: 15, used: 5 } }),
    });
    render(<CreditsCounter lang="en" />);
    await waitFor(() => {
      expect(screen.getByText('15/20')).toBeTruthy();
    });
  });

  it('shows liveRemaining override when provided', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: { monthlyLimit: 20, remaining: 15, used: 5 } }),
    });
    render(<CreditsCounter lang="en" liveRemaining={8} />);
    await waitFor(() => {
      expect(screen.getByText('8/20')).toBeTruthy();
    });
  });

  it('renders nothing when fetch returns no data', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ data: null }),
    });
    const { container } = render(<CreditsCounter lang="en" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
