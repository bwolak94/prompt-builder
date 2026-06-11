import { nanoid } from 'nanoid';
import type { PromptBlock } from '@/types';
import { PROMPT_SECTIONS } from '@/lib/constants';

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

const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Replaces all {{variable_name}} placeholders in the markdown with
 * the provided values map. Unknown variables are left as-is.
 */
export function substituteVariables(
  markdown: string,
  variables: Record<string, string>,
): string {
  return markdown.replace(VARIABLE_PATTERN, (match, name: string) => {
    return variables[name] ?? match;
  });
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
