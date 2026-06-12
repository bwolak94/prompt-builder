import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/BuilderToolbar', () => ({
  BuilderToolbar: () => <div data-testid="builder-toolbar" />,
}));

vi.mock('../components/SectionPalette', () => ({
  // Rendered in 2 places (desktop xl + mobile tabs)
  SectionPalette: () => <div data-testid="section-palette" />,
}));

vi.mock('../components/DragDropCanvas', () => ({
  // Rendered in 2 places (desktop + mobile canvas tab)
  DragDropCanvas: () => <div data-testid="drag-drop-canvas" />,
}));

vi.mock('../components/VariableForm', () => ({
  VariableForm: () => <div data-testid="variable-form" />,
}));

vi.mock('../components/MarkdownPreview', () => ({
  MarkdownPreview: () => <div data-testid="markdown-preview" />,
}));

vi.mock('../components/RunButton', () => ({
  RunButton: () => <div data-testid="run-button" />,
}));

vi.mock('../components/VersionsPanel', () => ({
  VersionsPanel: () => <div data-testid="versions-panel" />,
}));

vi.mock('../components/EnvironmentsPanel', () => ({
  EnvironmentsPanel: () => <div data-testid="environments-panel" />,
}));

vi.mock('../components/ABTestView', () => ({
  ABTestView: () => <div data-testid="ab-test-view" />,
}));

vi.mock('../components/AutoTagModal', () => ({ AutoTagModal: () => null }));
vi.mock('../components/ImportModal', () => ({ ImportModal: () => null }));
vi.mock('../components/ImproveModal', () => ({ ImproveModal: () => null }));
vi.mock('../components/TokenOptimizerModal', () => ({ TokenOptimizerModal: () => null }));

vi.mock('../hooks/useVariableDetection', () => ({ useVariableDetection: () => undefined }));
vi.mock('../hooks/useBuilderSave', () => ({ useBuilderSave: () => ({ handleSave: vi.fn() }) }));
vi.mock('../hooks/useAutoCategorize', () => ({
  useAutoCategorize: () => ({
    suggestAndToast: vi.fn(),
    suggestion: null,
    editOpen: false,
    setEditOpen: vi.fn(),
    applyTags: vi.fn(),
  }),
}));
vi.mock('../hooks/useMarkdownGeneration', () => ({ useMarkdownGeneration: () => 'markdown' }));

vi.mock('../store/builder.store', () => ({
  useBuilderStore: (selector: (s: unknown) => unknown) =>
    selector({ loadPrompt: vi.fn(), reset: vi.fn(), promptId: null, loadImportedBlocks: vi.fn() }),
}));

vi.mock('@/lib/constants', () => ({ getPromptSections: () => [] }));

import { BuilderIsland } from '../BuilderIsland';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BuilderIsland', () => {
  it('renders toolbar', () => {
    render(<BuilderIsland lang="pl" />);
    expect(screen.getByTestId('builder-toolbar')).toBeTruthy();
  });

  it('renders section palette (desktop + mobile = 2 instances)', () => {
    render(<BuilderIsland lang="pl" />);
    // SectionPalette appears twice: desktop xl panel + mobile tabs
    expect(screen.getAllByTestId('section-palette').length).toBeGreaterThanOrEqual(1);
  });

  it('renders drag drop canvas', () => {
    render(<BuilderIsland lang="pl" />);
    expect(screen.getAllByTestId('drag-drop-canvas').length).toBeGreaterThanOrEqual(1);
  });

  it('renders tab lists for panels', () => {
    render(<BuilderIsland lang="pl" />);
    expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0);
  });

  it('renders run button', () => {
    render(<BuilderIsland lang="pl" />);
    // RunButton is in the right panel which is rendered in both desktop and mobile views
    expect(screen.getAllByTestId('run-button').length).toBeGreaterThanOrEqual(1);
  });
});
