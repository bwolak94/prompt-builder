import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ── Constants ─────────────────────────────────────────────────────────────────

export const CATEGORIES = ['coding', 'writing', 'analysis', 'roleplay', 'other'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export type PromptCategory = (typeof CATEGORIES)[number];
export type PromptDifficulty = (typeof DIFFICULTIES)[number];

// ── Schema ────────────────────────────────────────────────────────────────────

export const SuggestionSchema = z.object({
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string().max(30)).min(1).max(5),
});

export type PromptSuggestion = z.infer<typeof SuggestionSchema>;

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI prompt categorization assistant. Given the content of an AI prompt, suggest:
1. A single category from: coding, writing, analysis, roleplay, other
2. A difficulty level: beginner, intermediate, advanced
3. 3–5 descriptive tags (short, lowercase, kebab-case or single words)

Return ONLY valid JSON matching exactly this schema:
{"category":"<one of: coding|writing|analysis|roleplay|other>","difficulty":"<one of: beginner|intermediate|advanced>","tags":["tag1","tag2","tag3"]}

No explanation, no markdown, no code blocks — just the raw JSON object.`;

// ── Service ───────────────────────────────────────────────────────────────────

export const autoCategorizeService = {
  async suggest(contentMd: string): Promise<PromptSuggestion> {
    const anthropic = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    });
    const truncated = contentMd.slice(0, 3000);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Categorize this prompt:\n\n${truncated}` }],
    });

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const parsed = SuggestionSchema.parse(JSON.parse(text));
    return parsed;
  },
};
