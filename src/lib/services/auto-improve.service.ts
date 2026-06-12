import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ImproveVariantId = 'concise' | 'precise' | 'structured';

export interface ImproveVariant {
  id: ImproveVariantId;
  label: string;
  content: string;
  explanation: string;
}

// ── Zod schema ─────────────────────────────────────────────────────────────────

const VariantsSchema = z.object({
  variants: z.array(
    z.object({
      id: z.enum(['concise', 'precise', 'structured']),
      label: z.string(),
      content: z.string(),
      explanation: z.string(),
    }),
  ).length(3),
});

// ── Prompts ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert prompt engineer. Produce exactly 3 improved variants of the given prompt text.

Variant types:
1. concise — shorter by ~30%, remove filler, keep all instructions
2. precise — same length but clearer, more specific, less ambiguous language
3. structured — same content with improved formatting and logical flow

For each variant provide:
- id: "concise" | "precise" | "structured"
- label: 3-5 word human-readable name
- content: the improved text (keep original language, do NOT translate)
- explanation: 1-2 sentences on why this version is better

Return ONLY valid JSON — no markdown, no code blocks:
{"variants":[{"id":"concise","label":"...","content":"...","explanation":"..."},{"id":"precise","label":"...","content":"...","explanation":"..."},{"id":"structured","label":"...","content":"...","explanation":"..."}]}`;

// ── Service ────────────────────────────────────────────────────────────────────

export const autoImproveService = {
  async improveBlock(content: string, sectionSlug?: string): Promise<ImproveVariant[]> {
    const anthropic = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    });

    const context = sectionSlug ? `Section type: ${sectionSlug}\n\n` : '';

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${context}Improve this prompt block:\n\n${content.slice(0, 4000)}` }],
    });

    return parseVariants(message);
  },

  async improveAll(contentMd: string): Promise<ImproveVariant[]> {
    const anthropic = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Improve this full prompt:\n\n${contentMd.slice(0, 8000)}` }],
    });

    return parseVariants(message);
  },
};

function parseVariants(message: Anthropic.Message): ImproveVariant[] {
  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  const parsed = VariantsSchema.parse(JSON.parse(raw));
  return parsed.variants;
}
