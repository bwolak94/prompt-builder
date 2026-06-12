import { nanoid } from 'nanoid';
import type { PromptBlock } from '@/types';
import { PROMPT_SECTIONS } from '@/lib/constants';
import { substituteSmartVariables } from '@/lib/variables/substitutor';

// ── Section label lookup ───────────────────────────────────────────────────────

function getSectionName(slug: string): string {
  return PROMPT_SECTIONS.find((s) => s.slug === slug)?.name ?? slug;
}

// ── blocksToMarkdown ──────────────────────────────────────────────────────────

/**
 * Converts an ordered array of PromptBlocks into a single Markdown string.
 * Each block becomes an H2 heading (section name) followed by the content.
 */
export function blocksToMarkdown(blocks: PromptBlock[]): string {
  if (blocks.length === 0) return '';

  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);

  return sorted
    .filter((b) => b.content.trim() !== '')
    .map((b) => `## ${getSectionName(b.section_slug)}\n\n${b.content.trim()}`)
    .join('\n\n---\n\n');
}

// ── substituteVariables ───────────────────────────────────────────────────────

/**
 * Replaces all variable tokens ({{name}} or smart {{name:type:params}}) in markdown.
 * Delegates to the smart substitutor for full F-04 support.
 * Backward-compatible: plain {{name}} tokens still work.
 */
export function substituteVariables(
  markdown: string,
  variables: Record<string, string>,
): string {
  return substituteSmartVariables(markdown, variables);
}

// ── generateSlug ─────────────────────────────────────────────────────────────

/**
 * Converts a title to a URL-safe slug and appends a nanoid suffix.
 * Example: "My Awesome Prompt" → "my-awesome-prompt-a1b2c3"
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${base}-${nanoid(6)}`;
}
