import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsRow } from '../StatsRow';
import type { Stats } from '../StatsRow';

const DEFAULT_STATS: Stats = {
  total: 12,
  public: 5,
  forks: 3,
  avgScore: 74,
};

describe('StatsRow', () => {
  it('renders all four stat cards', () => {
    render(<StatsRow stats={DEFAULT_STATS} />);
    expect(screen.getByText('Wszystkie')).toBeTruthy();
    expect(screen.getByText('Publiczne')).toBeTruthy();
    expect(screen.getByText('Forki')).toBeTruthy();
    expect(screen.getByText('Śr. ocena AI')).toBeTruthy();
  });

  it('displays total count', () => {
    render(<StatsRow stats={DEFAULT_STATS} />);
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('displays public count', () => {
    render(<StatsRow stats={DEFAULT_STATS} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('displays forks count', () => {
    render(<StatsRow stats={DEFAULT_STATS} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('displays avgScore formatted as /100', () => {
    render(<StatsRow stats={DEFAULT_STATS} />);
    expect(screen.getByText('74/100')).toBeTruthy();
  });

  it('shows "—" when avgScore is null', () => {
    render(<StatsRow stats={{ ...DEFAULT_STATS, avgScore: null }} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});
