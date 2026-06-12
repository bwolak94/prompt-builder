import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartVariableField } from '../SmartVariableField';
import type { SmartVariable } from '@/lib/variables/parser';

const makeVar = (overrides: Partial<SmartVariable>): SmartVariable => ({
  name: 'myVar',
  label: 'My Variable',
  type: 'text',
  defaultValue: '',
  ...overrides,
});

describe('SmartVariableField — text type', () => {
  it('renders a text input with the variable label', () => {
    render(
      <SmartVariableField variable={makeVar({ type: 'text' })} value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('My Variable')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('uses defaultValue when value is empty', () => {
    render(
      <SmartVariableField
        variable={makeVar({ type: 'text', defaultValue: 'Hello' })}
        value=""
        onChange={() => {}}
      />,
    );
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Hello');
  });

  it('prefers provided value over defaultValue', () => {
    render(
      <SmartVariableField
        variable={makeVar({ type: 'text', defaultValue: 'Default' })}
        value="Override"
        onChange={() => {}}
      />,
    );
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Override');
  });

  it('calls onChange when text input changes', () => {
    const onChange = vi.fn();
    render(
      <SmartVariableField variable={makeVar({ type: 'text' })} value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });
});

describe('SmartVariableField — multiline type', () => {
  it('renders a textarea for multiline type', () => {
    render(
      <SmartVariableField variable={makeVar({ type: 'multiline' })} value="" onChange={() => {}} />,
    );
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });
});

describe('SmartVariableField — boolean type', () => {
  it('renders a switch for boolean type', () => {
    render(
      <SmartVariableField
        variable={makeVar({ type: 'boolean' })}
        value="false"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('shows "Off" label when value is false', () => {
    render(
      <SmartVariableField
        variable={makeVar({ type: 'boolean' })}
        value="false"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('shows "On" label when value is true', () => {
    render(
      <SmartVariableField
        variable={makeVar({ type: 'boolean' })}
        value="true"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('On')).toBeTruthy();
  });
});

describe('SmartVariableField — select type', () => {
  it('renders a select trigger for select type', () => {
    render(
      <SmartVariableField
        variable={makeVar({
          type: 'select',
          options: ['formal', 'casual'],
          defaultValue: 'formal',
        })}
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('combobox')).toBeTruthy();
  });
});
