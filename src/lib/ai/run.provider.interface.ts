/**
 * AIRunProvider — interface for executing prompts against AI models.
 *
 * Follows the Open/Closed principle: adding a new provider means creating a
 * new file that implements this interface, with zero changes to existing code.
 *
 * The `run()` method is an async generator that yields text deltas as they
 * stream in from the model, enabling SSE streaming to the client.
 */

export interface RunOptions {
  /** Fully resolved prompt text (all variables substituted) */
  prompt: string;
  /** Model identifier, e.g. "gpt-4o-mini", "claude-haiku-4-5-20251001" */
  model: string;
  /** Optional system message */
  systemMessage?: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Abort signal for timeout/cancellation */
  signal?: AbortSignal;
}

export interface RunResult {
  /** Full response text (concatenated from streamed deltas) */
  text: string;
  /** Token usage (if reported by provider) */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIRunProvider {
  /** Provider identifier */
  readonly provider: string;
  /** Default model for this provider */
  readonly defaultModel: string;
  /** Available models */
  readonly models: readonly string[];
  /**
   * Streams response text deltas.
   * The generator yields string chunks as they arrive.
   * Throws on non-retryable errors.
   */
  run(options: RunOptions): AsyncGenerator<string, RunResult, unknown>;
}
