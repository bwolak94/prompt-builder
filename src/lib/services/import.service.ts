import { nanoid } from 'nanoid';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportedBlock {
  section_slug: string;
  content: string;
}

export interface ParsedImport {
  title: string;
  blocks: ImportedBlock[];
}

// ── Known section slugs and their detection patterns ──────────────────────────

const SECTION_PATTERNS: [RegExp, string][] = [
  [/^(?:##?\s*|[*_]{1,2})?role(?:[*_]{1,2})?[\s:：]/i, 'role'],
  [/^(?:##?\s*|[*_]{1,2})?persona(?:[*_]{1,2})?[\s:：]/i, 'role'],
  [/^(?:##?\s*|[*_]{1,2})?context(?:[*_]{1,2})?[\s:：]/i, 'context'],
  [/^(?:##?\s*|[*_]{1,2})?background(?:[*_]{1,2})?[\s:：]/i, 'context'],
  [/^(?:##?\s*|[*_]{1,2})?task(?:[*_]{1,2})?[\s:：]/i, 'task'],
  [/^(?:##?\s*|[*_]{1,2})?goal(?:[*_]{1,2})?[\s:：]/i, 'task'],
  [/^(?:##?\s*|[*_]{1,2})?objective(?:[*_]{1,2})?[\s:：]/i, 'task'],
  [/^(?:##?\s*|[*_]{1,2})?(?:output\s+)?format(?:[*_]{1,2})?[\s:：]/i, 'format'],
  [/^(?:##?\s*|[*_]{1,2})?response\s+format(?:[*_]{1,2})?[\s:：]/i, 'format'],
  [/^(?:##?\s*|[*_]{1,2})?constraints?(?:[*_]{1,2})?[\s:：]/i, 'constraints'],
  [/^(?:##?\s*|[*_]{1,2})?limitations?(?:[*_]{1,2})?[\s:：]/i, 'constraints'],
  [/^(?:##?\s*|[*_]{1,2})?rules?(?:[*_]{1,2})?[\s:：]/i, 'constraints'],
  [/^(?:##?\s*|[*_]{1,2})?examples?(?:[*_]{1,2})?[\s:：]/i, 'examples'],
  [/^(?:##?\s*|[*_]{1,2})?few[-\s]shots?(?:[*_]{1,2})?[\s:：]/i, 'examples'],
  [/^(?:##?\s*|[*_]{1,2})?tone(?:[*_]{1,2})?[\s:：]/i, 'tone'],
  [/^(?:##?\s*|[*_]{1,2})?style(?:[*_]{1,2})?[\s:：]/i, 'tone'],
  [/^(?:##?\s*|[*_]{1,2})?audience(?:[*_]{1,2})?[\s:：]/i, 'audience'],
  [/^(?:##?\s*|[*_]{1,2})?target\s+audience(?:[*_]{1,2})?[\s:：]/i, 'audience'],
  [/^(?:##?\s*|[*_]{1,2})?chain.of.thought(?:[*_]{1,2})?[\s:：]/i, 'chain_of_thought'],
  [/^(?:##?\s*|[*_]{1,2})?step.by.step(?:[*_]{1,2})?[\s:：]/i, 'chain_of_thought'],
  [/^(?:##?\s*|[*_]{1,2})?(?:json\s+)?(?:output\s+)?schema(?:[*_]{1,2})?[\s:：]/i, 'output_schema'],
];

function detectSectionSlug(line: string): string | null {
  for (const [pattern, slug] of SECTION_PATTERNS) {
    if (pattern.test(line.trim())) return slug;
  }
  return null;
}

function extractSectionContent(line: string): string {
  // Remove leading ##, **, __, section name, colon
  return line
    .replace(/^#{1,3}\s*/, '')
    .replace(/^[*_]{1,2}[^*_]+[*_]{1,2}\s*[:：]?\s*/, '')
    .replace(/^[^:：]+[:：]\s*/, '')
    .trim();
}

function inferTitle(text: string): string {
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) ?? '';
  // Remove markdown headers
  const clean = firstLine.replace(/^#+\s*/, '').trim();
  return clean.slice(0, 80) || 'Imported prompt';
}

// ── Heuristic parser ──────────────────────────────────────────────────────────

export function heuristicParse(text: string): ParsedImport {
  const lines = text.split('\n');
  const sections: { slug: string; lines: string[] }[] = [];

  let current: { slug: string; lines: string[] } | null = null;

  for (const rawLine of lines) {
    const slug = detectSectionSlug(rawLine);

    if (slug) {
      if (current && current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      const inlineContent = extractSectionContent(rawLine);
      current = { slug, lines: inlineContent ? [inlineContent] : [] };
    } else if (current) {
      current.lines.push(rawLine);
    } else {
      // Content before any header — treat as task
      if (!current) {
        current = { slug: 'task', lines: [rawLine] };
      }
    }
  }

  if (current && current.lines.some((l) => l.trim())) {
    sections.push(current);
  }

  // Fallback: no sections detected — put everything in task block
  if (sections.length === 0) {
    const trimmed = text.trim();
    if (trimmed) {
      sections.push({ slug: 'task', lines: [trimmed] });
    }
  }

  // Deduplicate slugs: if same slug appears twice, merge them
  const merged = new Map<string, string>();
  const order: string[] = [];
  for (const sec of sections) {
    const content = sec.lines.join('\n').trim();
    if (!content) continue;
    if (merged.has(sec.slug)) {
      merged.set(sec.slug, `${merged.get(sec.slug) ?? ''}\n\n${content}`);
    } else {
      merged.set(sec.slug, content);
      order.push(sec.slug);
    }
  }

  const blocks: ImportedBlock[] = order.map((slug) => ({
    section_slug: slug,
    content: merged.get(slug) ?? '',
  }));

  return { title: inferTitle(text), blocks };
}

// ── AI-powered parser ─────────────────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `You are a prompt structure analyzer. Given raw text of an AI prompt, extract its logical sections and map each one to a known section type.

Known section types: role, context, task, format, constraints, examples, tone, audience, chain_of_thought, output_schema

Rules:
- Split the prompt into meaningful logical parts
- Map each part to the closest matching section type
- Use "task" for general instructions that don't fit elsewhere
- Keep the original wording — do NOT rephrase content
- If the prompt has a clear role/persona at the start, map it to "role"
- Return ONLY a JSON array, no markdown, no code blocks

Schema: [{"section_slug": "<type>", "content": "<verbatim text>"}]`;

const BlockArraySchema = z.array(
  z.object({
    section_slug: z.string(),
    content: z.string(),
  }),
);

export async function aiParse(text: string): Promise<ParsedImport> {
  const truncated = text.slice(0, 6000);

  const anthropic = new Anthropic({
    apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: AI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Parse this prompt into sections:\n\n${truncated}` }],
  });

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  const blocks = BlockArraySchema.parse(JSON.parse(raw));

  return {
    title: inferTitle(text),
    blocks: blocks.map((b) => ({
      section_slug: b.section_slug,
      content: b.content.trim(),
    })),
  };
}

// ── Blocks with IDs (for builder store) ───────────────────────────────────────

export interface ImportedBlockWithId {
  id: string;
  section_slug: string;
  content: string;
  order_index: number;
}

export function withIds(blocks: ImportedBlock[]): ImportedBlockWithId[] {
  return blocks.map((b, i) => ({ ...b, id: nanoid(), order_index: i }));
}
