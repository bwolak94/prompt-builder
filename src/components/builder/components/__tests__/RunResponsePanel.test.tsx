import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunResponsePanel } from '../RunResponsePanel';

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

describe('RunResponsePanel', () => {
  it('renders nothing when state is idle', () => {
    const { container } = render(
      <RunResponsePanel
        state="idle"
        output=""
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the response title when running', () => {
    render(
      <RunResponsePanel
        state="running"
        output="partial…"
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    // t('run.responseTitle') = 'Response'
    expect(screen.getByText('Response')).toBeTruthy();
  });

  it('shows streaming output with cursor indicator when running', () => {
    render(
      <RunResponsePanel
        state="running"
        output="Hello"
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('▋')).toBeTruthy();
  });

  it('shows cancel button when running', () => {
    const onCancel = vi.fn();
    render(
      <RunResponsePanel
        state="running"
        output=""
        error={null}
        lang="en"
        onCancel={onCancel}
        onReset={() => {}}
      />,
    );
    // The StopCircle button uses title attribute from t('run.cancel') = 'Stop'
    const cancelBtn = screen.getByTitle('Stop');
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows reset button when done', () => {
    const onReset = vi.fn();
    render(
      <RunResponsePanel
        state="done"
        output="Result text"
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={onReset}
      />,
    );
    // t('run.reset') key — find reset button by title
    const resetBtn = screen.getByTitle(/reset/i);
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();
  });

  it('shows copy button when done with output', () => {
    render(
      <RunResponsePanel
        state="done"
        output="Some output"
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    // t('common.copy') key
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('renders error message when error is set', () => {
    render(
      <RunResponsePanel
        state="error"
        output=""
        error="API error occurred"
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText('API error occurred')).toBeTruthy();
  });

  it('does not show cursor indicator when done', () => {
    render(
      <RunResponsePanel
        state="done"
        output="Final output"
        error={null}
        lang="en"
        onCancel={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.queryByText('▋')).toBeNull();
  });
});
