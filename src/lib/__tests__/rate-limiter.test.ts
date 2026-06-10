import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, resetStore } from '../rate-limiter';

beforeEach(() => {
  resetStore();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  // ── Requests within the limit ──────────────────────────────────────────────

  it('allows requests under the limit', () => {
    const result = checkRateLimit('ai-score:user-1', 5, 60_000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining count correctly across multiple requests', () => {
    checkRateLimit('ai-score:user-1', 3, 60_000);
    checkRateLimit('ai-score:user-1', 3, 60_000);
    const result = checkRateLimit('ai-score:user-1', 3, 60_000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  // ── Limit exceeded ─────────────────────────────────────────────────────────

  it('blocks the request when the limit is reached', () => {
    checkRateLimit('ai-score:user-1', 3, 60_000);
    checkRateLimit('ai-score:user-1', 3, 60_000);
    checkRateLimit('ai-score:user-1', 3, 60_000);

    const result = checkRateLimit('ai-score:user-1', 3, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('does not record a timestamp when the limit is exceeded', () => {
    checkRateLimit('ai-score:user-1', 1, 60_000); // fills the limit
    checkRateLimit('ai-score:user-1', 1, 60_000); // blocked — should NOT be recorded

    // Advance time past the window to expire the original request
    vi.advanceTimersByTime(60_001);

    // Should be allowed again (only 1 timestamp was recorded, now expired)
    const result = checkRateLimit('ai-score:user-1', 1, 60_000);
    expect(result.allowed).toBe(true);
  });

  // ── Window reset ───────────────────────────────────────────────────────────

  it('resets the window after windowMs elapses', () => {
    checkRateLimit('ai-score:user-1', 2, 60_000);
    checkRateLimit('ai-score:user-1', 2, 60_000);
    // Limit exhausted — blocked
    expect(checkRateLimit('ai-score:user-1', 2, 60_000).allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(60_001);

    const result = checkRateLimit('ai-score:user-1', 2, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('returns a resetAt timestamp in the future while requests are active', () => {
    const now = Date.now();
    checkRateLimit('ai-score:user-1', 5, 60_000);
    const result = checkRateLimit('ai-score:user-1', 5, 60_000);

    expect(result.resetAt).toBeGreaterThan(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + 60_000);
  });

  // ── Multiple keys are isolated ─────────────────────────────────────────────

  it('tracks different keys independently', () => {
    // Exhaust user-1
    checkRateLimit('ai-score:user-1', 1, 60_000);
    const blockedResult = checkRateLimit('ai-score:user-1', 1, 60_000);

    // user-2 should be unaffected
    const allowedResult = checkRateLimit('ai-score:user-2', 1, 60_000);

    expect(blockedResult.allowed).toBe(false);
    expect(allowedResult.allowed).toBe(true);
  });

  it('allows many distinct keys without interfering', () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      checkRateLimit(`ai-score:user-${i}`, 1, 60_000),
    );

    expect(results.every((r) => r.allowed)).toBe(true);
  });

  // ── Sliding window: partial expiry ─────────────────────────────────────────

  it('slides the window correctly — only expired timestamps are pruned', () => {
    vi.setSystemTime(0);

    checkRateLimit('ai-score:user-1', 3, 60_000); // t=0
    vi.advanceTimersByTime(30_000);
    checkRateLimit('ai-score:user-1', 3, 60_000); // t=30s
    vi.advanceTimersByTime(30_001);
    // t=60.001s — first request (t=0) has expired, second (t=30s) still active

    const result = checkRateLimit('ai-score:user-1', 3, 60_000);
    // 1 active + this new request = 2, so remaining = 1
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });
});
