import Anthropic from '@anthropic-ai/sdk';
import type { AIRunProvider, RunOptions, RunResult } from '../run.provider.interface';

export const ANTHROPIC_RUN_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
] as const;
export type AnthropicRunModel = (typeof ANTHROPIC_RUN_MODELS)[number];

export class AnthropicRunProvider implements AIRunProvider {
  readonly provider = 'anthropic';
  readonly defaultModel = 'claude-haiku-4-5-20251001';
  readonly models = ANTHROPIC_RUN_MODELS;

  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *run(options: RunOptions): AsyncGenerator<string, RunResult, unknown> {
    const { prompt, model, systemMessage, maxTokens = 2048, signal } = options;

    const stream = await this.client.messages.stream(
      {
        model,
        max_tokens: maxTokens,
        system: systemMessage,
        messages: [{ role: 'user', content: prompt }],
      },
      { signal },
    );

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const delta = event.delta.text;
        fullText += delta;
        yield delta;
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens;
      }
      if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
      }
    }

    return {
      text: fullText,
      usage: inputTokens > 0 ? { inputTokens, outputTokens } : undefined,
    };
  }
}
