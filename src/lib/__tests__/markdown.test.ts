import { describe, it, expect } from 'vitest';
import { blocksToMarkdown, substituteVariables, generateSlug } from '../markdown';
import type { PromptBlock } from '@/types';

const block = (slug: string, content: string, order = 0): PromptBlock => ({
  id: `b-${order}`,
  section_slug: slug,
  content,
  order_index: order,
});

describe('blocksToMarkdown', () => {
  it('returns empty string for no blocks', () => {
    expect(blocksToMarkdown([])).toBe('');
  });

  it('renders a single block', () => {
    const result = blocksToMarkdown([block('role', 'Be helpful', 0)]);
    expect(result).toContain('## Rola');
    expect(result).toContain('Be helpful');
  });

  it('separates multiple blocks with hr', () => {
    const result = blocksToMarkdown([
      block('role', 'Be helpful', 0),
      block('task', 'Write code', 1),
    ]);
    expect(result).toContain('---');
    expect(result).toContain('## Zadanie');
  });

  it('respects order_index, not array position', () => {
    const result = blocksToMarkdown([
      block('task', 'Task first', 0),
      block('role', 'Role second', 1),
    ]);
    const roleIdx = result.indexOf('## Rola');
    const taskIdx = result.indexOf('## Zadanie');
    expect(taskIdx).toBeLessThan(roleIdx);
  });

  it('skips empty blocks', () => {
    const result = blocksToMarkdown([
      block('role', '', 0),
      block('task', 'Do something', 1),
    ]);
    expect(result).not.toContain('## Rola');
    expect(result).toContain('## Zadanie');
  });

  it('uses slug as fallback for unknown section names', () => {
    const result = blocksToMarkdown([block('custom_section', 'content', 0)]);
    expect(result).toContain('## custom_section');
  });
});

describe('substituteVariables', () => {
  it('replaces a single variable', () => {
    expect(substituteVariables('Hello {{name}}', { name: 'Alice' })).toBe('Hello Alice');
  });

  it('replaces multiple occurrences of the same variable', () => {
    const result = substituteVariables('{{x}} and {{x}}', { x: 'foo' });
    expect(result).toBe('foo and foo');
  });

  it('leaves unknown variables as-is', () => {
    const result = substituteVariables('Hello {{missing}}', {});
    expect(result).toBe('Hello {{missing}}');
  });

  it('handles empty variables map', () => {
    expect(substituteVariables('no vars here', {})).toBe('no vars here');
  });

  it('handles multiple different variables', () => {
    const result = substituteVariables('{{a}} + {{b}} = {{c}}', { a: '1', b: '2', c: '3' });
    expect(result).toBe('1 + 2 = 3');
  });
});

describe('generateSlug', () => {
  it('converts title to lowercase kebab-case', () => {
    const slug = generateSlug('My Awesome Prompt');
    expect(slug).toMatch(/^my-awesome-prompt-[a-zA-Z0-9_-]{6}$/);
  });

  it('removes special characters', () => {
    const slug = generateSlug('Hello! World? (test)');
    expect(slug).toMatch(/^hello-world-test-[a-zA-Z0-9_-]{6}$/);
  });

  it('always appends a nanoid suffix of ~6 chars at the end', () => {
    const slug = generateSlug('test');
    // slug ends with "-<nanoid>" where nanoid is 6 URL-safe chars
    expect(slug).toMatch(/-[A-Za-z0-9_-]{6}$/);
  });

  it('truncates long titles to 60 chars base', () => {
    const longTitle = 'a'.repeat(100);
    const slug = generateSlug(longTitle);
    // Strip the trailing "-<nanoid6>" suffix (separator + exactly 6 URL-safe chars)
    const base = slug.replace(/-[A-Za-z0-9_-]{6}$/, '');
    expect(base.length).toBeLessThanOrEqual(60);
  });
});
