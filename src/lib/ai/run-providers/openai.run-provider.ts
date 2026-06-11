import OpenAI from 'openai';
import type { AIRunProvider, RunOptions, RunResult } from '../run.provider.interface';

export const OPENAI_RUN_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] as const;
export type OpenAIRunModel = (typeof OPENAI_RUN_MODELS)[number];

export class OpenAIRunProvider implements AIRunProvider {
  readonly provider = 'openai';
  readonly defaultModel = 'gpt-4o-mini';
  readonly models = OPENAI_RUN_MODELS;

  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async *run(options: RunOptions): AsyncGenerator<string, RunResult, unknown> {
    const { prompt, model, systemMessage, maxTokens = 2048, signal } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal },
    );

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullText += delta;
        yield delta;
      }
      // Usage arrives on the last chunk
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
      }
    }

    return {
      text: fullText,
      usage: inputTokens > 0 ? { inputTokens, outputTokens } : undefined,
    };
  }
}
