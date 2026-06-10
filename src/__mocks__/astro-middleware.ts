// Stub for astro:middleware — only used in the Vitest environment.
// defineMiddleware is a pass-through for type inference in Astro; it returns
// the handler function unchanged so tests can call it directly.
export function defineMiddleware(fn: unknown): unknown {
  return fn;
}
