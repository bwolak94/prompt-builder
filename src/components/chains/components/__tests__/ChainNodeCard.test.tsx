import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChainNodeCard } from '../ChainNodeCard';
import type { LocalNode } from '../../hooks/useChainBuilder';

const NODE: LocalNode = {
  id: 'n1',
  chain_id: 'ch1',
  prompt_id: null,
  title: 'Step One',
  content_md: 'Write a summary.',
  order_index: 0,
  created_at: new Date().toISOString(),
};

const DEFAULT_PROPS = {
  node: NODE,
  index: 0,
  total: 2,
  isRunning: false,
  isPl: false,
  onChange: vi.fn(),
  onRemove: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
};

describe('ChainNodeCard', () => {
  it('renders the node title', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} />);
    expect((screen.getByLabelText('Step title') as HTMLInputElement).value).toBe('Step One');
  });

  it('renders step number badge (1-based)', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('renders prompt content in textarea', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText('Prompt content')).toBeTruthy();
    expect(
      (screen.getByRole('textbox', { name: 'Prompt content' }) as HTMLTextAreaElement).value,
    ).toBe('Write a summary.');
  });

  it('calls onChange when title is changed', () => {
    const onChange = vi.fn();
    render(<ChainNodeCard {...DEFAULT_PROPS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Step title'), { target: { value: 'New Title' } });
    expect(onChange).toHaveBeenCalledWith('n1', { title: 'New Title' });
  });

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn();
    render(<ChainNodeCard {...DEFAULT_PROPS} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Remove step'));
    expect(onRemove).toHaveBeenCalledWith('n1');
  });

  it('disables move-up button for first item', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} index={0} />);
    expect((screen.getByLabelText('Move up') as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables move-down button for last item', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} index={1} total={2} />);
    expect((screen.getByLabelText('Move down') as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onMoveUp when up button is clicked (non-first)', () => {
    const onMoveUp = vi.fn();
    render(<ChainNodeCard {...DEFAULT_PROPS} index={1} total={2} onMoveUp={onMoveUp} />);
    fireEvent.click(screen.getByLabelText('Move up'));
    expect(onMoveUp).toHaveBeenCalled();
  });

  it('shows Polish labels when isPl=true', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} isPl={true} />);
    expect(screen.getByLabelText('Tytuł kroku')).toBeTruthy();
  });

  it('disables inputs when isRunning=true', () => {
    render(<ChainNodeCard {...DEFAULT_PROPS} isRunning={true} />);
    expect((screen.getByLabelText('Step title') as HTMLInputElement).disabled).toBe(true);
  });

  it('shows run output when runState has output', () => {
    render(
      <ChainNodeCard
        {...DEFAULT_PROPS}
        runState={{ status: 'done', output: 'Chain result here', error: null }}
      />,
    );
    expect(screen.getByText('Chain result here')).toBeTruthy();
  });

  it('shows run error when runState has error', () => {
    render(
      <ChainNodeCard
        {...DEFAULT_PROPS}
        runState={{ status: 'error', output: '', error: 'Timeout error' }}
      />,
    );
    expect(screen.getByText('Timeout error')).toBeTruthy();
  });
});
