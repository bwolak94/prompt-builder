import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

import RegisterForm from '../RegisterForm';

describe('RegisterForm', () => {
  it('renders all form fields', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText('Nazwa wyświetlana')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Hasło')).toBeTruthy();
    expect(screen.getByLabelText('Potwierdź hasło')).toBeTruthy();
  });

  it('renders submit button', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /Utwórz konto/i })).toBeTruthy();
  });

  it('renders terms and privacy links', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('link', { name: /Regulamin/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Politykę prywatności/i })).toBeTruthy();
  });

  it('toggles password visibility', () => {
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText('Hasło') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Pokaż hasło'));
    expect(passwordInput.type).toBe('text');
  });

  it('toggles confirm password visibility', () => {
    render(<RegisterForm />);
    const confirmInput = screen.getByLabelText('Potwierdź hasło') as HTMLInputElement;
    expect(confirmInput.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Pokaż potwierdzenie hasła'));
    expect(confirmInput.type).toBe('text');
  });

  it('shows validation errors on empty submit', async () => {
    render(<RegisterForm />);
    fireEvent.click(screen.getByRole('button', { name: /Utwórz konto/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('calls POST /api/auth/register on valid submission', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText('Nazwa wyświetlana'), {
      target: { value: 'Jan Kowalski' },
    });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: /Utwórz konto/i }));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
