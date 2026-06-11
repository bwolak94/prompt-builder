import Anthropic from '@anthropic-ai/sdk';
import type { ScoringProvider } from '../scoring.provider';
import { SCORING_SYSTEM_PROMPT, buildScoringPrompt } from '../scoring.prompts';

const anthropic = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
});

export class AnthropicScoringProvider implements ScoringProvider {
  readonly name = 'anthropic' as const;

  async *score(content: string): AsyncIterable<string> {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SCORING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildScoringPrompt(content) }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
