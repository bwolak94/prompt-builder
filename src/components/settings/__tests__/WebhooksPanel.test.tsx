import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import { WebhooksPanel } from '../WebhooksPanel';

const WEBHOOK = {
  id: 'wh1',
  type: 'generic',
  label: 'My Webhook',
  url: 'https://example.com/hook',
  events: ['prompt.forked'],
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('WebhooksPanel — loading', () => {
  it('shows loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<WebhooksPanel />);
    expect(screen.getByText(/Ładowanie/)).toBeTruthy();
  });
});

describe('WebhooksPanel — empty', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('renders section title', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => expect(screen.getByText('Integracje (Webhooks)')).toBeTruthy());
  });

  it('shows Add Integration button', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => expect(screen.getByText('Dodaj integrację')).toBeTruthy());
  });
});

describe('WebhooksPanel — with webhooks', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [WEBHOOK] }) });
  });

  it('shows webhook label', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => expect(screen.getByText('My Webhook')).toBeTruthy());
  });

  it('shows webhook URL', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => expect(screen.getByText('https://example.com/hook')).toBeTruthy());
  });

  it('shows webhook type badge', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => expect(screen.getByText('generic')).toBeTruthy());
  });
});

describe('WebhooksPanel — create form', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('opens create form when Add Integration clicked', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => screen.getByText('Dodaj integrację'));
    fireEvent.click(screen.getByText('Dodaj integrację'));
    expect(screen.getByText('Nowa integracja')).toBeTruthy();
  });

  it('shows type toggle buttons in form', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => screen.getByText('Dodaj integrację'));
    fireEvent.click(screen.getByText('Dodaj integrację'));
    expect(screen.getByText('generic')).toBeTruthy();
    expect(screen.getByText('slack')).toBeTruthy();
    expect(screen.getByText('discord')).toBeTruthy();
  });

  it('shows event checkboxes in form', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => screen.getByText('Dodaj integrację'));
    fireEvent.click(screen.getByText('Dodaj integrację'));
    expect(screen.getByText('Prompt forked')).toBeTruthy();
    expect(screen.getByText('New comment')).toBeTruthy();
  });

  it('cancel button hides the form', async () => {
    render(<WebhooksPanel />);
    await waitFor(() => screen.getByText('Dodaj integrację'));
    fireEvent.click(screen.getByText('Dodaj integrację'));
    fireEvent.click(screen.getByText('Anuluj'));
    expect(screen.queryByText('Nowa integracja')).toBeFalsy();
  });
});

describe('WebhooksPanel — English', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('renders English title', async () => {
    render(<WebhooksPanel lang="en" />);
    await waitFor(() => expect(screen.getByText('Integrations (Webhooks)')).toBeTruthy());
  });
});
