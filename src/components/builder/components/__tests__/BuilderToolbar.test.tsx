import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSetTitle = vi.fn();
const mockSetIsPublic = vi.fn();
const mockSave = vi.fn();

let mockTitle = 'My Prompt';
let mockIsPublic = false;
let mockIsDirty = false;
let mockIsSaving = false;

vi.mock('../../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) => {
    const state = {
      title: mockTitle,
      isPublic: mockIsPublic,
      isDirty: mockIsDirty,
      isSaving: mockIsSaving,
      setTitle: mockSetTitle,
      setIsPublic: mockSetIsPublic,
      save: mockSave,
    };
    return selector(state);
  },
}));

import { BuilderToolbar } from '../BuilderToolbar';

beforeEach(() => {
  mockTitle = 'My Prompt';
  mockIsPublic = false;
  mockIsDirty = false;
  mockIsSaving = false;
  mockSetTitle.mockClear();
  mockSetIsPublic.mockClear();
  mockSave.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BuilderToolbar', () => {
  it('renders back button', () => {
    render(<BuilderToolbar />);
    expect(screen.getByLabelText('Wróć')).toBeTruthy();
  });

  it('renders title input with store value', () => {
    render(<BuilderToolbar />);
    const input = screen.getByPlaceholderText('Tytuł promptu…') as HTMLInputElement;
    expect(input.value).toBe('My Prompt');
  });

  it('calls setTitle on title change', () => {
    render(<BuilderToolbar />);
    fireEvent.change(screen.getByPlaceholderText('Tytuł promptu…'), {
      target: { value: 'New Title' },
    });
    expect(mockSetTitle).toHaveBeenCalledWith('New Title');
  });

  it('shows "Prywatny" when isPublic is false', () => {
    render(<BuilderToolbar />);
    expect(screen.getByText('Prywatny')).toBeTruthy();
  });

  it('shows "Publiczny" when isPublic is true', () => {
    mockIsPublic = true;
    render(<BuilderToolbar />);
    expect(screen.getByText('Publiczny')).toBeTruthy();
  });

  it('toggles isPublic on visibility button click', () => {
    render(<BuilderToolbar />);
    fireEvent.click(screen.getByLabelText(/Prywatny/));
    expect(mockSetIsPublic).toHaveBeenCalledWith(true);
  });

  it('renders save button', () => {
    render(<BuilderToolbar />);
    expect(screen.getByLabelText('Zapisz prompt')).toBeTruthy();
  });

  it('save button is disabled when isDirty is false', () => {
    mockIsDirty = false;
    render(<BuilderToolbar />);
    const saveBtn = screen.getByLabelText('Zapisz prompt') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('save button is enabled when isDirty is true', () => {
    mockIsDirty = true;
    render(<BuilderToolbar />);
    const saveBtn = screen.getByLabelText('Zapisz prompt') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('renders Import button when onImport provided', () => {
    const onImport = vi.fn();
    render(<BuilderToolbar onImport={onImport} />);
    expect(screen.getByLabelText('Import prompt')).toBeTruthy();
  });

  it('renders Improve button when onImproveAll provided', () => {
    const onImproveAll = vi.fn();
    render(<BuilderToolbar onImproveAll={onImproveAll} />);
    expect(screen.getByLabelText('Ulepsz cały prompt')).toBeTruthy();
  });

  it('renders Token Optimizer button when onOptimize provided', () => {
    const onOptimize = vi.fn();
    render(<BuilderToolbar onOptimize={onOptimize} />);
    expect(screen.getByLabelText('Optymalizuj tokeny')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<BuilderToolbar onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Wróć'));
    expect(onBack).toHaveBeenCalled();
  });
});
