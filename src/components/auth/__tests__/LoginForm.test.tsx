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

import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Hasło')).toBeTruthy();
  });

  it('renders submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /Zaloguj się/i })).toBeTruthy();
  });

  it('renders forgot password link', () => {
    render(<LoginForm />);
    expect(screen.getByText('Zapomniałeś hasła?')).toBeTruthy();
  });

  it('shows validation error for invalid email on submit', async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'notanemail' } });
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Zaloguj się/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText('Hasło') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Pokaż hasło'));
    expect(passwordInput.type).toBe('text');
  });

  it('calls POST /api/auth/login on valid submission', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Zaloguj się/i }));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
