import { describe, it, expect } from 'vitest';
import { parseVariableDefinition, parseSmartVariables } from '../parser';
import type { PromptBlock } from '@/types';

const block = (content: string): PromptBlock => ({
  id: 'b1',
  section_slug: 'task',
  content,
  order_index: 0,
});

// ── parseVariableDefinition ────────────────────────────────────────────────────

describe('parseVariableDefinition', () => {
  it('defaults to text type when no type given', () => {
    const v = parseVariableDefinition('name');
    expect(v.type).toBe('text');
    expect(v.name).toBe('name');
    expect(v.defaultValue).toBe('');
  });

  it('explicit text type with default value', () => {
    const v = parseVariableDefinition('lang', 'text', 'English');
    expect(v.type).toBe('text');
    expect(v.defaultValue).toBe('English');
  });

  it('humanizes snake_case name to label', () => {
    const v = parseVariableDefinition('my_var_name');
    expect(v.label).toBe('My var name');
  });

  it('humanizes camelCase name to label', () => {
    const v = parseVariableDefinition('myVarName');
    expect(v.label).toBe('My Var Name');
  });

  it('parses select type with options', () => {
    const v = parseVariableDefinition('tone', 'select', 'formal,casual,technical');
    expect(v.type).toBe('select');
    expect(v.options).toEqual(['formal', 'casual', 'technical']);
    expect(v.defaultValue).toBe('formal');
  });

  it('select with no options returns empty default', () => {
    const v = parseVariableDefinition('choice', 'select', '');
    expect(v.options).toEqual([]);
    expect(v.defaultValue).toBe('');
  });

  it('parses number type with min, max, step', () => {
    const v = parseVariableDefinition('temp', 'number', '0:1:0.1');
    expect(v.type).toBe('number');
    expect(v.min).toBe(0);
    expect(v.max).toBe(1);
    expect(v.step).toBe(0.1);
    expect(v.defaultValue).toBe('0');
  });

  it('number defaults: min=0, max=100, step=1', () => {
    const v = parseVariableDefinition('count', 'number');
    expect(v.min).toBe(0);
    expect(v.max).toBe(100);
    expect(v.step).toBe(1);
  });

  it('parses multiline type', () => {
    const v = parseVariableDefinition('bio', 'multiline', 'Enter text here');
    expect(v.type).toBe('multiline');
    expect(v.defaultValue).toBe('Enter text here');
  });

  it('parses boolean type defaulting to false', () => {
    const v = parseVariableDefinition('flag', 'boolean');
    expect(v.type).toBe('boolean');
    expect(v.defaultValue).toBe('false');
  });

  it('parses boolean:true default', () => {
    const v = parseVariableDefinition('flag', 'boolean', 'true');
    expect(v.defaultValue).toBe('true');
  });

  it('unknown type falls through to text', () => {
    const v = parseVariableDefinition('x', 'unknown_type' as 'text');
    expect(v.type).toBe('text');
  });
});

// ── parseSmartVariables ────────────────────────────────────────────────────────

describe('parseSmartVariables', () => {
  it('returns empty array for blocks with no variables', () => {
    expect(parseSmartVariables([block('Hello world')])).toEqual([]);
  });

  it('detects a single plain {{name}} variable', () => {
    const result = parseSmartVariables([block('Hello {{name}}')]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('name');
    expect(result[0].type).toBe('text');
  });

  it('detects typed variable {{lang:select:en,pl}}', () => {
    const result = parseSmartVariables([block('Language: {{lang:select:en,pl}}')]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('select');
    expect(result[0].options).toEqual(['en', 'pl']);
  });

  it('deduplicates variables across blocks (last definition wins)', () => {
    const blocks: PromptBlock[] = [
      { id: 'b1', section_slug: 'role', content: '{{tone:select:formal}}', order_index: 0 },
      { id: 'b2', section_slug: 'task', content: '{{tone:select:casual,formal}}', order_index: 1 },
    ];
    const result = parseSmartVariables(blocks);
    expect(result).toHaveLength(1);
    // last definition wins
    expect(result[0].options).toEqual(['casual', 'formal']);
  });

  it('preserves first-seen insertion order', () => {
    const result = parseSmartVariables([block('{{b}} and {{a}} and {{c}}')]);
    expect(result.map((v) => v.name)).toEqual(['b', 'a', 'c']);
  });

  it('collects variables from multiple blocks', () => {
    const blocks: PromptBlock[] = [
      { id: 'b1', section_slug: 'role', content: '{{role}}', order_index: 0 },
      { id: 'b2', section_slug: 'task', content: '{{task}}', order_index: 1 },
    ];
    const result = parseSmartVariables(blocks);
    expect(result.map((v) => v.name)).toEqual(['role', 'task']);
  });

  it('ignores content without variable syntax', () => {
    expect(parseSmartVariables([block('Just plain text')])).toHaveLength(0);
    expect(parseSmartVariables([block('{single_brace}')])).toHaveLength(0);
  });
});
