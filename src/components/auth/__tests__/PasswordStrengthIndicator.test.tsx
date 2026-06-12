import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Zbyt słabe" for a very short password', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('Zbyt słabe')).toBeTruthy();
  });

  it('shows "Słabe" for a medium-length password without special chars', () => {
    render(<PasswordStrengthIndicator password="abcdefghijkl" />);
    // length >= 8 (score++) and >= 12 (score++) but no uppercase+digit combo = score 2 → "Słabe"
    expect(screen.getByText('Słabe')).toBeTruthy();
  });

  it('shows "Silne" for a strong password with all criteria met', () => {
    render(<PasswordStrengthIndicator password="Abcdefgh1!long" />);
    expect(screen.getByText('Silne')).toBeTruthy();
  });

  it('renders 4 bar segments', () => {
    render(<PasswordStrengthIndicator password="password1" />);
    const bar = screen.getByRole('img', { name: /Siła hasła/i });
    // 4 div children inside the bar
    expect(bar.children.length).toBe(4);
  });

  it('includes aria-label with strength label', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByRole('img', { name: /Siła hasła: Zbyt słabe/i })).toBeTruthy();
  });
});
