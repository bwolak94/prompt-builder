import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBar';
import type { FilterValue } from '../FilterBar';

const COUNTS = { all: 10, public: 4, private: 6, unscored: 2 };

describe('FilterBar', () => {
  it('renders all four tab buttons', () => {
    render(<FilterBar active="all" counts={COUNTS} onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Wszystkie/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Publiczne/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Prywatne/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Bez oceny/ })).toBeTruthy();
  });

  it('marks active tab with aria-selected="true"', () => {
    render(<FilterBar active="public" counts={COUNTS} onChange={() => {}} />);
    const publicTab = screen.getByRole('tab', { name: /Publiczne/ });
    expect((publicTab as HTMLButtonElement).getAttribute('aria-selected')).toBe('true');
  });

  it('marks inactive tabs with aria-selected="false"', () => {
    render(<FilterBar active="all" counts={COUNTS} onChange={() => {}} />);
    const privateTab = screen.getByRole('tab', { name: /Prywatne/ });
    expect((privateTab as HTMLButtonElement).getAttribute('aria-selected')).toBe('false');
  });

  it('calls onChange with correct filter value on click', () => {
    const onChange = vi.fn<(filter: FilterValue) => void>();
    render(<FilterBar active="all" counts={COUNTS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Prywatne/ }));
    expect(onChange).toHaveBeenCalledWith('private');
  });

  it('displays correct counts in each tab', () => {
    render(<FilterBar active="all" counts={COUNTS} onChange={() => {}} />);
    // counts appear as badge text inside each tab
    const tabs = screen.getAllByRole('tab');
    const tabTexts = tabs.map((t) => t.textContent ?? '');
    expect(tabTexts[0]).toContain('10');
    expect(tabTexts[1]).toContain('4');
    expect(tabTexts[2]).toContain('6');
    expect(tabTexts[3]).toContain('2');
  });
});
