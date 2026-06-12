import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockPromptId: string | null = 'prompt-123';

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => selector({ promptId: mockPromptId }),
}));

const mockFetchVersions = vi.fn();
const mockCreateVersion = vi.fn();
const mockFetchVersion = vi.fn();
const mockRestoreVersion = vi.fn();
const mockClearSelected = vi.fn();

let mockVersions: unknown[] = [];
let mockLoading = false;
let mockCreating = false;
let mockRestoring = false;
let mockSelectedVersion: unknown = null;

vi.mock('../../hooks/useVersions', () => ({
  useVersions: () => ({
    versions: mockVersions,
    loading: mockLoading,
    creating: mockCreating,
    restoring: mockRestoring,
    selectedVersion: mockSelectedVersion,
    fetchVersions: mockFetchVersions,
    createVersion: mockCreateVersion,
    fetchVersion: mockFetchVersion,
    restoreVersion: mockRestoreVersion,
    clearSelected: mockClearSelected,
  }),
}));

import { VersionsPanel } from '../VersionsPanel';

beforeEach(() => {
  mockPromptId = 'prompt-123';
  mockVersions = [];
  mockLoading = false;
  mockCreating = false;
  mockRestoring = false;
  mockSelectedVersion = null;
  mockFetchVersions.mockClear();
  mockCreateVersion.mockClear();
  mockClearSelected.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VersionsPanel', () => {
  it('renders Version history title', () => {
    render(<VersionsPanel lang="en" />);
    expect(screen.getByText('Version history')).toBeTruthy();
  });

  it('renders Save version button', () => {
    render(<VersionsPanel lang="en" />);
    expect(screen.getByText('Save version')).toBeTruthy();
  });

  it('shows empty state when no versions', () => {
    render(<VersionsPanel lang="en" />);
    expect(screen.getByText('No saved versions yet.')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockLoading = true;
    render(<VersionsPanel lang="en" />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders version list', () => {
    mockVersions = [
      {
        id: 'v1',
        version_number: 1,
        title: 'My Prompt',
        created_at: new Date().toISOString(),
        preview: 'Preview text',
        change_summary: 'Initial version',
      },
    ];
    render(<VersionsPanel lang="en" />);
    expect(screen.getByText('v1')).toBeTruthy();
    expect(screen.getByText('Initial version')).toBeTruthy();
  });

  it('opens create dialog when Save version button clicked', () => {
    render(<VersionsPanel lang="en" />);
    fireEvent.click(screen.getByText('Save version'));
    // Dialog title is also 'Save version', so there should now be 2 occurrences
    expect(screen.getAllByText('Save version').length).toBeGreaterThanOrEqual(2);
  });

  it('Save version button is disabled when promptId is null', () => {
    mockPromptId = null;
    render(<VersionsPanel lang="en" />);
    const btns = screen.getAllByText('Save version');
    const btn = btns[0] as HTMLButtonElement;
    expect(btn.closest('button')?.disabled).toBe(true);
  });
});
