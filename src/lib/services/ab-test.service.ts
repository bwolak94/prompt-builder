/**
 * ABTestService — orchestrates A/B prompt testing.
 *
 * Responsibilities (S):
 *   - Create test sessions with variant snapshots
 *   - Run parallel AI scoring (offline)
 *   - Mux parallel live runs (SSE)
 *   - Resolve winner and optionally apply to prompt
 *
 * Delegates: scoring → getScoringProvider, live run → runService
 */

import type { SupabaseClient } from '@/db/supabase.client';
import { abTestRepo, type ABTest, type ABVariant } from '@/db/repositories/ab-test.repo';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { promptService } from '@/lib/services/prompt.service';
import { getScoringProvider, ScoreResponseSchema } from '@/lib/ai/scoring.provider';
import { getRunProvider, type RunProviderName } from '@/lib/ai/run-provider.factory';
import { decryptApiKey } from '@/lib/crypto/encrypt';
import { userApiKeysRepo } from '@/db/repositories/user-api-keys.repo';
import { runCreditsRepo } from '@/db/repositories/run-credits.repo';
import type { ScoreResult, AIProvider, Prompt } from '@/types';

// ── Score accumulator ─────────────────────────────────────────────────────────

async function collectScore(content: string, provider: AIProvider): Promise<ScoreResult> {
  const scoringProvider = await getScoringProvider(provider);
  let rawJson = '';

  for await (const delta of scoringProvider.score(content)) {
    rawJson += delta;
  }

  const parsed = ScoreResponseSchema.parse(JSON.parse(rawJson));
  const modelUsed = provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001';

  return {
    overall_score: parsed.overall,
    scores: {
      clarity: parsed.dimensions.clarity.score,
      specificity: parsed.dimensions.specificity.score,
      structure: parsed.dimensions.structure.score,
      tone: parsed.dimensions.tone.score,
      completeness: parsed.dimensions.completeness.score,
    },
    feedback: parsed.dimensions,
    model_used: modelUsed,
    provider,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const abTestService = {
  /**
   * Create a new A/B test from the current prompt state.
   * Variant A = current prompt snapshot.
   * Variant B = clone of A (user edits it in the UI).
   */
  async createTest(
    supabase: SupabaseClient,
    promptId: string,
    userId: string,
  ): Promise<ABTest> {
    const prompt = await promptRepo.findById(supabase, promptId);
    if (!prompt) throw new Error('Prompt not found');
    if (prompt.user_id !== userId) throw new Error('Forbidden');

    const variant: ABVariant = {
      blocks: prompt.blocks,
      content_md: prompt.content_md,
    };

    return abTestRepo.create(supabase, {
      userId,
      promptId,
      variantA: variant,
      variantB: { ...variant, blocks: prompt.blocks.map((b) => ({ ...b })) },
    });
  },

  /**
   * Score both variants in parallel (offline mode).
   * Returns updated test with score_a, score_b, status='scored'.
   */
  async scoreVariants(
    supabase: SupabaseClient,
    testId: string,
    provider: AIProvider = 'openai',
  ): Promise<ABTest> {
    const test = await abTestRepo.findById(supabase, testId);
    if (!test) throw new Error('A/B test not found');

    const [scoreA, scoreB] = await Promise.all([
      collectScore(test.variant_a.content_md, provider),
      collectScore(test.variant_b.content_md, provider),
    ]);

    return abTestRepo.update(supabase, testId, {
      score_a: scoreA,
      score_b: scoreB,
      status: 'scored',
    });
  },

  /**
   * Stream both variants live in parallel.
   * Yields SSE-formatted strings interleaving events from A and B.
   * Event format: data: { "variant": "a"|"b", "type": "delta"|"done"|"error", "delta"?: string }
   */
  async *streamBothVariants(
    supabase: SupabaseClient,
    testId: string,
    userId: string,
    provider: RunProviderName,
    model: string,
    useByok: boolean,
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    const test = await abTestRepo.findById(supabase, testId);
    if (!test) throw new Error('A/B test not found');

    const encode = (obj: object) => `data: ${JSON.stringify(obj)}\n\n`;

    // Resolve API key once
    let apiKey: string | undefined;
    if (useByok) {
      const encrypted = await userApiKeysRepo.getEncryptedKey(supabase, userId, provider);
      if (!encrypted) {
        yield encode({ variant: 'a', type: 'error', error: 'No BYOK key configured' });
        yield encode({ variant: 'b', type: 'error', error: 'No BYOK key configured' });
        yield encode({ type: 'done' });
        return;
      }
      apiKey = await decryptApiKey(encrypted);
    } else {
      const credits = await runCreditsRepo.checkAndIncrement(supabase, userId);
      if (!credits.allowed) {
        yield encode({ type: 'error', error: 'Monthly run limit reached' });
        yield encode({ type: 'done' });
        return;
      }
    }

    const runProvider = getRunProvider({ provider, apiKey });
    const responseA: string[] = [];
    const responseB: string[] = [];

    // Run both variants concurrently using Promise-based queues
    const queue: string[] = [];
    let finished = 0;
    const TOTAL = 2;

    const runVariant = async (variant: 'a' | 'b', content: string) => {
      try {
        const gen = runProvider.run({ prompt: content, model, signal });
        let result = await gen.next();

        while (!result.done) {
          const delta = result.value as string;
          (variant === 'a' ? responseA : responseB).push(delta);
          queue.push(encode({ variant, type: 'delta', delta }));
          result = await gen.next();
        }

        queue.push(encode({ variant, type: 'done' }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Run failed';
        queue.push(encode({ variant, type: 'error', error: msg }));
      } finally {
        finished++;
      }
    };

    // Start both variants
    const promiseA = runVariant('a', test.variant_a.content_md);
    const promiseB = runVariant('b', test.variant_b.content_md);

    // Drain queue while both are running, then wait for completion
    while (finished < TOTAL || queue.length > 0) {
      if (queue.length > 0) {
        const events = queue.splice(0, queue.length);
        for (const ev of events) yield ev;
      } else {
        // Yield control briefly to let promises progress
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      }
      if (signal?.aborted) break;
    }

    await Promise.allSettled([promiseA, promiseB]);

    // Persist responses fire-and-forget
    const fullA = responseA.join('');
    const fullB = responseB.join('');
    void abTestRepo.update(supabase, testId, {
      response_a: fullA,
      response_b: fullB,
      model_used: model,
      status: 'ran',
    });

    yield encode({ type: 'done' });
  },

  /**
   * Resolve the test: set winner, optionally apply B to prompt.
   */
  async resolveTest(
    supabase: SupabaseClient,
    testId: string,
    userId: string,
    winner: 'a' | 'b' | 'tie',
    applyWinner: boolean,
  ): Promise<{ test: ABTest; prompt?: Prompt }> {
    const test = await abTestRepo.findById(supabase, testId);
    if (!test) throw new Error('A/B test not found');
    if (test.user_id !== userId) throw new Error('Forbidden');

    const updatedTest = await abTestRepo.update(supabase, testId, {
      winner,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });

    if (!applyWinner || winner === 'tie' || winner === 'a') {
      return { test: updatedTest };
    }

    // Apply winner B to the live prompt
    const variantB = test.variant_b;
    const updatedPrompt = await promptService.updatePrompt(
      supabase,
      test.prompt_id,
      userId,
      { blocks: variantB.blocks },
    );

    return { test: updatedTest, prompt: updatedPrompt };
  },
};
