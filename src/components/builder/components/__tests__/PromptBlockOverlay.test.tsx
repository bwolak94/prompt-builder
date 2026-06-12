import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PromptBlockOverlay } from '../PromptBlockOverlay';

describe('PromptBlockOverlay', () => {
  it('renders plain text without highlights', () => {
    const { container } = render(<PromptBlockOverlay content="Hello world" />);
    expect(container.textContent).toContain('Hello world');
  });

  it('highlights {{variable}} tokens with <mark>', () => {
    const { container } = render(<PromptBlockOverlay content="Hello {{name}}" />);
    const mark = container.querySelector('mark');
    expect(mark).toBeTruthy();
    expect((mark as HTMLElement).textContent).toBe('{{name}}');
  });

  it('highlights multiple variables', () => {
    const { container } = render(<PromptBlockOverlay content="{{a}} and {{b}}" />);
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
  });

  it('preserves text between variables', () => {
    const { container } = render(<PromptBlockOverlay content="Start {{x}} end" />);
    expect(container.textContent).toContain('Start');
    expect(container.textContent).toContain('end');
  });

  it('is aria-hidden to hide from screen readers', () => {
    const { container } = render(<PromptBlockOverlay content="text" />);
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders empty content without error', () => {
    const { container } = render(<PromptBlockOverlay content="" />);
    expect(container.firstChild).toBeTruthy();
  });
});
