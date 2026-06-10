/**
 * In-memory sliding-window rate limiter.
 *
 * Each key tracks an array of request timestamps within the current window.
 * Entries older than `windowMs` are pruned on every check, preventing leaks.
 * The store is module-level so it persists for the lifetime of the Node process.
 */

export interface RateLimitResult {
  /** Whether the request is allowed under the current limit */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Timestamp (ms since epoch) when the oldest request in the window expires */
  resetAt: number;
}

interface WindowEntry {
  /** Sorted list of timestamps (ms) of requests in the current window */
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

/**
 * Check and record a request against the rate limit for `key`.
 *
 * @param key       Unique identifier, e.g. `"ai-score:${userId}"`
 * @param limit     Maximum number of requests allowed per window
 * @param windowMs  Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Retrieve or initialise the entry
  const entry: WindowEntry = store.get(key) ?? { timestamps: [] };

  // Prune timestamps outside the current window (auto-cleanup)
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const count = entry.timestamps.length;
  const allowed = count < limit;

  if (allowed) {
    entry.timestamps.push(now);
    store.set(key, entry);
  }

  // resetAt = when the oldest active timestamp will fall out of the window
  const oldestTimestamp = entry.timestamps[0] ?? now;
  const resetAt = oldestTimestamp + windowMs;
  const remaining = Math.max(0, limit - entry.timestamps.length);

  return { allowed, remaining, resetAt };
}

/**
 * Remove all entries from the store.
 * Useful in tests to reset state between runs.
 */
export function resetStore(): void {
  store.clear();
}
