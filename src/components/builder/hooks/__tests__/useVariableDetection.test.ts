import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VARIABLE_REGEX } from '@/lib/constants';
import type { PromptBlock } from '@/types';

// Test the detection logic directly (pure function extract)
function detectVariables(blocks: PromptBlock[]): string[] {
  const seen = new Set<string>();
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');

  for (const block of blocks) {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(block.content)) !== null) {
      seen.add(match[1]);
    }
  }
  return Array.from(seen);
}

const makeBlock = (content: string, id = 'b1'): PromptBlock => ({
  id,
  section_slug: 'task',
  content,
  order_index: 0,
});

describe('variable detection logic', () => {
  it('detects a single variable', () => {
    const vars = detectVariables([makeBlock('Hello {{name}}')]);
    expect(vars).toEqual(['name']);
  });

  it('detects multiple different variables', () => {
    const vars = detectVariables([makeBlock('{{greeting}} {{name}}, you are {{age}} years old')]);
    expect(vars).toContain('greeting');
    expect(vars).toContain('name');
    expect(vars).toContain('age');
  });

  it('deduplicates the same variable name', () => {
    const vars = detectVariables([makeBlock('{{name}} and {{name}} again')]);
    expect(vars.filter((v) => v === 'name')).toHaveLength(1);
  });

  it('deduplicates across multiple blocks', () => {
    const vars = detectVariables([
      makeBlock('{{user}}', 'b1'),
      makeBlock('Hello {{user}}', 'b2'),
    ]);
    expect(vars.filter((v) => v === 'user')).toHaveLength(1);
  });

  it('returns empty array when no variables', () => {
    const vars = detectVariables([makeBlock('No variables here')]);
    expect(vars).toHaveLength(0);
  });

  it('ignores invalid variable patterns', () => {
    const vars = detectVariables([makeBlock('{{ invalid }} {{123bad}} {{_ok}}')]);
    expect(vars).toContain('_ok');
    expect(vars).not.toContain(' invalid ');
    expect(vars).not.toContain('123bad');
  });

  it('handles empty blocks', () => {
    const vars = detectVariables([makeBlock('')]);
    expect(vars).toHaveLength(0);
  });

  it('preserves detection order (first occurrence wins for dedup)', () => {
    const vars = detectVariables([
      makeBlock('{{b}} then {{a}}'),
    ]);
    expect(vars[0]).toBe('b');
    expect(vars[1]).toBe('a');
  });
});
