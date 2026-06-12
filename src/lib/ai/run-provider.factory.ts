/**
 * Factory for AIRunProvider instances.
 *
 * Returns the correct provider implementation based on the provider name.
 * Supports both hosted (platform) keys and BYOK (user-supplied) keys.
 *
 * Open/Closed: to add a new provider, create a new class and add a case here.
 */

import { OpenAIRunProvider } from './run-providers/openai.run-provider';
import { AnthropicRunProvider } from './run-providers/anthropic.run-provider';
import type { AIRunProvider } from './run.provider.interface';

export type RunProviderName = 'openai' | 'anthropic';

export interface ProviderConfig {
  provider: RunProviderName;
  /** If omitted, falls back to platform env var */
  apiKey?: string;
}

export function getRunProvider(config: ProviderConfig): AIRunProvider {
  const { provider, apiKey } = config;

  switch (provider) {
    case 'openai': {
      const key = apiKey ?? import.meta.env.OPENAI_API_KEY;
      if (!key) throw new Error('OpenAI API key not configured');
      return new OpenAIRunProvider(key);
    }
    case 'anthropic': {
      const key = apiKey ?? import.meta.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('Anthropic API key not configured');
      return new AnthropicRunProvider(key);
    }
    default:
      throw new Error(`Unknown run provider: ${provider as string}`);
  }
}

export const RUN_PROVIDER_MODELS: Record<RunProviderName, readonly string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'],
};
