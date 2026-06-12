/**
 * RunService — orchestrates prompt execution.
 *
 * Responsibilities (S):
 *   - Resolve which API key to use (hosted vs BYOK)
 *   - Check run credits for hosted runs
 *   - Substitute template variables
 *   - Stream response via AIRunProvider
 *   - Write run_logs entry
 *
 * Does NOT handle HTTP streaming — that's the API route's job.
 */

import type { SupabaseClient } from '@/db/supabase.client';
import { getRunProvider, type RunProviderName } from '@/lib/ai/run-provider.factory';
import { decryptApiKey } from '@/lib/crypto/encrypt';
import { runCreditsRepo } from '@/db/repositories/run-credits.repo';
import { userApiKeysRepo } from '@/db/repositories/user-api-keys.repo';

export interface RunRequest {
  userId: string;
  promptText: string;
  provider: RunProviderName;
  model: string;
  /** If true, use the user's BYOK key instead of platform key */
  useByok?: boolean;
  /** Abort signal for timeout/cancellation */
  signal?: AbortSignal;
}

export interface RunStreamEvent {
  type: 'delta' | 'done' | 'error' | 'credits';
  delta?: string;
  error?: string;
  creditsRemaining?: number;
}

export const runService = {
  /**
   * Execute a prompt and yield SSE-compatible events.
   * Yields { type: 'delta', delta } chunks, then { type: 'done' }.
   * Yields { type: 'error', error } on failure.
   */
  async *stream(supabase: SupabaseClient, req: RunRequest): AsyncGenerator<RunStreamEvent> {
    const { userId, promptText, provider, model, useByok = false, signal } = req;
    const startTime = Date.now();
    let keySource: 'hosted' | 'byok' = 'hosted';
    let apiKey: string | undefined;

    // ── Resolve API key ──────────────────────────────────────────────────────
    if (useByok) {
      const encrypted = await userApiKeysRepo.getEncryptedKey(supabase, userId, provider);
      if (!encrypted) {
        yield { type: 'error', error: 'No BYOK key configured for this provider' };
        return;
      }
      try {
        apiKey = await decryptApiKey(encrypted);
        keySource = 'byok';
      } catch {
        yield { type: 'error', error: 'Failed to decrypt API key' };
        return;
      }
    } else {
      // ── Check hosted credits ───────────────────────────────────────────────
      const credits = await runCreditsRepo.checkAndIncrement(supabase, userId);
      if (!credits.allowed) {
        yield {
          type: 'error',
          error: 'Monthly run limit reached. Upgrade to Pro or add your own API key.',
        };
        return;
      }
      yield { type: 'credits', creditsRemaining: credits.remaining };
    }

    // ── Stream from provider ─────────────────────────────────────────────────
    const runProvider = getRunProvider({ provider, apiKey });
    let _fullText = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    let status: 'success' | 'error' | 'timeout' = 'success';
    let errorMessage: string | undefined;

    try {
      const gen = runProvider.run({ prompt: promptText, model, signal });
      let result = await gen.next();

      while (!result.done) {
        const delta = result.value as string;
        _fullText += delta;
        yield { type: 'delta', delta };
        result = await gen.next();
      }

      // Final value carries RunResult with usage
      const runResult = result.value;
      if (runResult && typeof runResult === 'object' && 'usage' in runResult && runResult.usage) {
        inputTokens = runResult.usage.inputTokens;
        outputTokens = runResult.usage.outputTokens;
      }

      yield { type: 'done' };
    } catch (err) {
      status = signal?.aborted ? 'timeout' : 'error';
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
      yield { type: 'error', error: errorMessage };
    } finally {
      // ── Fire-and-forget: write run log ─────────────────────────────────────
      const duration = Date.now() - startTime;
      void supabase
        .from('run_logs')
        .insert({
          user_id: userId,
          provider,
          model,
          key_source: keySource,
          input_tokens: inputTokens ?? null,
          output_tokens: outputTokens ?? null,
          status,
          error_message: errorMessage ?? null,
          duration_ms: duration,
        })
        .then(({ error: logErr }) => {
          if (logErr) console.error('[run] failed to write log:', logErr.message);
        });

      // Touch BYOK key last_used_at
      if (keySource === 'byok') {
        userApiKeysRepo.touchLastUsed(supabase, userId, provider).catch(() => {});
      }
    }
  },
};
