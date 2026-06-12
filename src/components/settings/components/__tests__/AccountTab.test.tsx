import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountTab } from '../AccountTab';

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AccountTab', () => {
  it('renders change password section', () => {
    render(<AccountTab email="user@example.com" />);
    expect(screen.getByText('Zmiana hasła')).toBeTruthy();
  });

  it('renders new password input', () => {
    render(<AccountTab email="user@example.com" />);
    expect(screen.getByLabelText('Nowe hasło')).toBeTruthy();
  });

  it('renders confirm password input', () => {
    render(<AccountTab email="user@example.com" />);
    expect(screen.getByLabelText('Potwierdź hasło')).toBeTruthy();
  });

  it('shows password mismatch error', () => {
    render(<AccountTab email="user@example.com" />);
    fireEvent.change(screen.getByLabelText('Nowe hasło'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByText('Zmień hasło'));
    expect(screen.getByText('Hasła nie są identyczne.')).toBeTruthy();
  });

  it('shows length error when password is too short', () => {
    render(<AccountTab email="user@example.com" />);
    fireEvent.change(screen.getByLabelText('Nowe hasło'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Zmień hasło'));
    expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków.')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    render(<AccountTab email="user@example.com" />);
    const passwordInput = screen.getByLabelText('Nowe hasło') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Pokaż hasło'));
    expect(passwordInput.type).toBe('text');
  });

  it('renders danger zone section', () => {
    render(<AccountTab email="user@example.com" />);
    expect(screen.getByText('Strefa niebezpieczna')).toBeTruthy();
    expect(screen.getByText('Usuń konto')).toBeTruthy();
  });

  it('opens delete confirmation dialog when "Usuń konto" is clicked', async () => {
    render(<AccountTab email="user@example.com" />);
    fireEvent.click(screen.getByText('Usuń konto'));
    await waitFor(() => {
      expect(screen.getByText('Usunąć konto?')).toBeTruthy();
      // Email is shown inside the open dialog
      expect(screen.getByText('user@example.com')).toBeTruthy();
    });
  });

  it('calls POST /api/auth/change-password on valid password change', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<AccountTab email="user@example.com" />);
    fireEvent.change(screen.getByLabelText('Nowe hasło'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByText('Zmień hasło'));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/change-password',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
