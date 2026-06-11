import OpenAI from 'openai';
import type { ScoringProvider } from '../scoring.provider';
import { SCORING_SYSTEM_PROMPT, buildScoringPrompt } from '../scoring.prompts';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
});

export class OpenAIScoringProvider implements ScoringProvider {
  readonly name = 'openai' as const;

  async *score(content: string): AsyncIterable<string> {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: buildScoringPrompt(content) },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) yield delta;
    }
  }
}
