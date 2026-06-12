import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a search input with correct placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeTruthy();
    expect(screen.getByPlaceholderText('Szukaj szablonów…')).toBeTruthy();
  });

  it('has accessible aria-label', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Szukaj szablonów')).toBeTruthy();
  });

  it('debounces onChange call by 300ms', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'react' } });
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('react');
  });

  it('shows clear button when value is non-empty', () => {
    render(<SearchBar value="react" onChange={() => {}} />);
    expect(screen.getByLabelText('Wyczyść wyszukiwanie')).toBeTruthy();
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByLabelText('Wyczyść wyszukiwanie')).toBeNull();
  });

  it('calls onChange with empty string when clear button is clicked', () => {
    const onChange = vi.fn();
    render(<SearchBar value="react" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Wyczyść wyszukiwanie'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
