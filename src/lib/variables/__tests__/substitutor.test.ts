import { describe, it, expect } from 'vitest';
import { substituteSmartVariables } from '../substitutor';

describe('substituteSmartVariables', () => {
  // ── Basic substitution ────────────────────────────────────────────────────

  it('replaces a plain {{name}} token', () => {
    expect(substituteSmartVariables('Hello {{name}}', { name: 'Alice' })).toBe('Hello Alice');
  });

  it('replaces multiple occurrences of the same variable', () => {
    expect(substituteSmartVariables('{{x}} + {{x}}', { x: '1' })).toBe('1 + 1');
  });

  it('replaces multiple distinct variables', () => {
    expect(substituteSmartVariables('{{a}} {{b}}', { a: 'Hello', b: 'World' })).toBe('Hello World');
  });

  it('returns text unchanged when there are no variables', () => {
    expect(substituteSmartVariables('no vars here', {})).toBe('no vars here');
  });

  // ── Unknown variables → default / empty ───────────────────────────────────

  it('replaces unknown plain variable with empty string', () => {
    expect(substituteSmartVariables('Hello {{missing}}', {})).toBe('Hello ');
  });

  it('uses inline default for text:default syntax', () => {
    expect(substituteSmartVariables('Hello {{name:text:World}}', {})).toBe('Hello World');
  });

  it('user value takes precedence over inline default', () => {
    expect(substituteSmartVariables('{{name:text:Default}}', { name: 'Override' })).toBe(
      'Override',
    );
  });

  // ── Select variables ──────────────────────────────────────────────────────

  it('substitutes select variable with provided value', () => {
    expect(
      substituteSmartVariables('Tone: {{tone:select:formal,casual}}', { tone: 'casual' }),
    ).toBe('Tone: casual');
  });

  it('select falls back to first option when no value provided', () => {
    expect(substituteSmartVariables('{{tone:select:formal,casual}}', {})).toBe('formal');
  });

  // ── Number variables ──────────────────────────────────────────────────────

  it('substitutes number variable with provided value', () => {
    expect(substituteSmartVariables('Temp: {{t:number:0:1}}', { t: '0.7' })).toBe('Temp: 0.7');
  });

  it('number falls back to min (default value) when no value provided', () => {
    expect(substituteSmartVariables('{{count:number:5:100}}', {})).toBe('5');
  });

  // ── Boolean variables ─────────────────────────────────────────────────────

  it('substitutes boolean with provided value', () => {
    expect(substituteSmartVariables('{{flag:boolean}}', { flag: 'true' })).toBe('true');
  });

  it('boolean defaults to false when no value provided', () => {
    expect(substituteSmartVariables('{{flag:boolean}}', {})).toBe('false');
  });

  it('boolean:true defaults to true', () => {
    expect(substituteSmartVariables('{{flag:boolean:true}}', {})).toBe('true');
  });

  // ── Multiline variables ───────────────────────────────────────────────────

  it('substitutes multiline variable', () => {
    expect(substituteSmartVariables('Bio: {{bio:multiline}}', { bio: 'Line 1\nLine 2' })).toBe(
      'Bio: Line 1\nLine 2',
    );
  });

  it('multiline falls back to inline default', () => {
    expect(substituteSmartVariables('{{desc:multiline:Enter text}}', {})).toBe('Enter text');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('handles empty string value', () => {
    expect(substituteSmartVariables('{{name}}', { name: '' })).toBe('');
  });

  it('does not match single-brace syntax', () => {
    expect(substituteSmartVariables('{name}', { name: 'Alice' })).toBe('{name}');
  });

  it('preserves surrounding text', () => {
    const result = substituteSmartVariables('Start {{a}} middle {{b}} end', {
      a: 'X',
      b: 'Y',
    });
    expect(result).toBe('Start X middle Y end');
  });
});
