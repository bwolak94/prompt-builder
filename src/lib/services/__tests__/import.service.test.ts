import { describe, it, expect } from 'vitest';
import { heuristicParse } from '../import.service';

describe('heuristicParse', () => {
  // ── Section detection ─────────────────────────────────────────────────────

  it('detects a "role:" header', () => {
    const result = heuristicParse('Role: You are a helpful assistant.');
    expect(result.blocks.find((b) => b.section_slug === 'role')).toBeTruthy();
  });

  it('detects a "## Task" markdown header', () => {
    const result = heuristicParse('## Task\nWrite a poem.');
    expect(result.blocks.find((b) => b.section_slug === 'task')).toBeTruthy();
  });

  it('detects "Context:" section', () => {
    const result = heuristicParse('Context: Background info here.');
    expect(result.blocks.find((b) => b.section_slug === 'context')).toBeTruthy();
  });

  it('detects "Format:" section', () => {
    const result = heuristicParse('Format: Return JSON.');
    expect(result.blocks.find((b) => b.section_slug === 'format')).toBeTruthy();
  });

  it('detects "Constraints:" section', () => {
    const result = heuristicParse('Constraints: Keep it short.');
    expect(result.blocks.find((b) => b.section_slug === 'constraints')).toBeTruthy();
  });

  it('detects "Examples:" section', () => {
    const result = heuristicParse('Examples:\n- example 1\n- example 2');
    expect(result.blocks.find((b) => b.section_slug === 'examples')).toBeTruthy();
  });

  it('detects "Tone:" section', () => {
    const result = heuristicParse('Tone: Professional');
    expect(result.blocks.find((b) => b.section_slug === 'tone')).toBeTruthy();
  });

  // ── Multi-section parsing ─────────────────────────────────────────────────

  it('parses multiple sections in one prompt', () => {
    const text = [
      'Role: Expert developer',
      'Task: Write TypeScript code',
      'Format: Return clean code only',
    ].join('\n');

    const result = heuristicParse(text);
    expect(result.blocks.map((b) => b.section_slug)).toContain('role');
    expect(result.blocks.map((b) => b.section_slug)).toContain('task');
    expect(result.blocks.map((b) => b.section_slug)).toContain('format');
  });

  it('captures content belonging to each section', () => {
    const text = 'Role: You are a coach\nTask: Motivate the user';
    const result = heuristicParse(text);
    const roleBlock = result.blocks.find((b) => b.section_slug === 'role');
    expect(roleBlock?.content).toContain('You are a coach');
  });

  // ── Fallback behavior ─────────────────────────────────────────────────────

  it('places unstructured text in a task block', () => {
    const result = heuristicParse('Just write a haiku about cats.');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].section_slug).toBe('task');
    expect(result.blocks[0].content).toContain('Just write a haiku about cats.');
  });

  it('returns empty blocks array for empty input', () => {
    const result = heuristicParse('');
    expect(result.blocks).toHaveLength(0);
  });

  it('returns empty blocks for whitespace-only input', () => {
    const result = heuristicParse('   \n\n  ');
    expect(result.blocks).toHaveLength(0);
  });

  // ── Title inference ───────────────────────────────────────────────────────

  it('infers title from the first non-empty line', () => {
    const result = heuristicParse('# My Awesome Prompt\nRole: assistant');
    expect(result.title).toBe('My Awesome Prompt');
  });

  it('falls back to "Imported prompt" when all lines are empty', () => {
    const result = heuristicParse('');
    expect(result.title).toBe('Imported prompt');
  });

  it('strips markdown heading markers from title', () => {
    const result = heuristicParse('## Generate code\nTask: Do it');
    // "## Generate code" → first line is a task header; title comes from next meaningful line
    expect(result.title).not.toContain('##');
  });

  // ── Duplicate slug merging ────────────────────────────────────────────────

  it('merges duplicate section slugs', () => {
    const text = ['Task: First part', 'Context: some background', 'Task: Second part'].join('\n');

    const result = heuristicParse(text);
    const taskBlocks = result.blocks.filter((b) => b.section_slug === 'task');
    expect(taskBlocks).toHaveLength(1);
    expect(taskBlocks[0].content).toContain('First part');
    expect(taskBlocks[0].content).toContain('Second part');
  });

  // ── Bold/italic header recognition ───────────────────────────────────────

  it('recognises **Role:** bold syntax', () => {
    const result = heuristicParse('**Role:** You are an expert');
    expect(result.blocks.find((b) => b.section_slug === 'role')).toBeTruthy();
  });
});
