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

import { RestApiKeysPanel } from '../RestApiKeysPanel';

const KEY = {
  id: 'k1',
  key_prefix: 'pb_live_abc',
  key_suffix: 'xyz',
  label: 'My App',
  rate_limit: 1000,
  last_used_at: null,
  request_count: 5,
  created_at: new Date().toISOString(),
};

describe('RestApiKeysPanel — loading', () => {
  it('shows loading indicator initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<RestApiKeysPanel />);
    expect(screen.getByText(/Ładowanie/)).toBeTruthy();
  });
});

describe('RestApiKeysPanel — empty state', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('shows section title', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText('Klucze REST API')).toBeTruthy());
  });

  it('shows empty state message', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText('Brak kluczy API.')).toBeTruthy());
  });

  it('shows New Key button', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText('Nowy klucz')).toBeTruthy());
  });

  it('shows usage example code snippet', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText(/Authorization/)).toBeTruthy());
  });
});

describe('RestApiKeysPanel — with keys', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [KEY] }) });
  });

  it('displays key label', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText('My App')).toBeTruthy());
  });

  it('displays masked key', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText(/pb_live_abc.*xyz/)).toBeTruthy());
  });

  it('displays request count', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByText(/5\/1000/)).toBeTruthy());
  });

  it('renders delete button for each key', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => expect(screen.getByLabelText('Usuń klucz My App')).toBeTruthy());
  });
});

describe('RestApiKeysPanel — create flow', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('shows create form when New Key button clicked', async () => {
    render(<RestApiKeysPanel />);
    await waitFor(() => screen.getByText('Nowy klucz'));
    fireEvent.click(screen.getByText('Nowy klucz'));
    expect(screen.getByPlaceholderText(/np\. "My App"/)).toBeTruthy();
  });
});

describe('RestApiKeysPanel — English', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  it('renders English title', async () => {
    render(<RestApiKeysPanel lang="en" />);
    await waitFor(() => expect(screen.getByText('REST API Keys')).toBeTruthy());
  });
});
