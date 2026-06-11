/**
 * Smart Variable Parser — F-04
 *
 * Syntax:
 *   {{name}}                         → text (backward compat)
 *   {{name:text}}                    → text (explicit)
 *   {{name:text:default value}}      → text with default
 *   {{name:select:opt1,opt2,opt3}}   → select (first = default)
 *   {{name:number:1:10}}             → number slider min=1 max=10
 *   {{name:number:1:10:0.5}}         → number min=1 max=10 step=0.5
 *   {{name:multiline}}               → textarea
 *   {{name:multiline:default text}}  → textarea with default
 *   {{name:boolean}}                 → toggle (default: false)
 *   {{name:boolean:true}}            → toggle (default: true)
 */

import type { PromptBlock } from '@/types';

export type SmartVariableType = 'text' | 'select' | 'number' | 'multiline' | 'boolean';

export interface SmartVariable {
  name: string;
  type: SmartVariableType;
  /** Humanized label: "my_var" → "My var" */
  label: string;
  /** Always a string; number/boolean values are serialized */
  defaultValue: string;
  /** Only for 'select' */
  options?: string[];
  /** Only for 'number' */
  min?: number;
  /** Only for 'number' */
  max?: number;
  /** Only for 'number', default 1 */
  step?: number;
}

/**
 * Matches: {{name}} or {{name:type}} or {{name:type:params}}
 * Groups: [1]=name, [2]=type (optional), [3]=params (optional)
 */
export const SMART_VAR_REGEX =
  /\{\{([a-zA-Z_][a-zA-Z0-9_]*)(?::([a-z]+)(?::([^}]*))?)?\}\}/g;

function humanize(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Parse a single match (name + optional type + optional params string) into a SmartVariable. */
export function parseVariableDefinition(
  name: string,
  rawType?: string,
  rawParams?: string,
): SmartVariable {
  const type = (rawType ?? 'text') as SmartVariableType;
  const label = humanize(name);

  switch (type) {
    case 'select': {
      const options = rawParams ? rawParams.split(',').map((s) => s.trim()).filter(Boolean) : [];
      return { name, type: 'select', label, defaultValue: options[0] ?? '', options };
    }
    case 'number': {
      const parts = rawParams ? rawParams.split(':') : [];
      const min = parts[0] !== undefined ? parseFloat(parts[0]) : 0;
      const max = parts[1] !== undefined ? parseFloat(parts[1]) : 100;
      const step = parts[2] !== undefined ? parseFloat(parts[2]) : 1;
      return { name, type: 'number', label, defaultValue: String(min), min, max, step };
    }
    case 'multiline':
      return { name, type: 'multiline', label, defaultValue: rawParams ?? '' };
    case 'boolean': {
      const defaultValue = rawParams === 'true' ? 'true' : 'false';
      return { name, type: 'boolean', label, defaultValue };
    }
    default:
      return { name, type: 'text', label, defaultValue: rawParams ?? '' };
  }
}

/**
 * Scan all blocks and return deduplicated SmartVariable list.
 * Later occurrences of same name override earlier ones (last wins).
 * Preserves first-seen order.
 */
export function parseSmartVariables(blocks: PromptBlock[]): SmartVariable[] {
  const order: string[] = [];
  const map = new Map<string, SmartVariable>();

  const regex = new RegExp(SMART_VAR_REGEX.source, 'g');

  for (const block of blocks) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(block.content)) !== null) {
      const [, name, rawType, rawParams] = match;
      if (!map.has(name)) order.push(name);
      map.set(name, parseVariableDefinition(name, rawType, rawParams));
    }
  }

  return order.map((name) => map.get(name)!);
}
