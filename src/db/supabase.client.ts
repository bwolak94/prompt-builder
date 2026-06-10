/**
 * Supabase client factory — server-side and browser-side.
 *
 * Server client  : uses @supabase/ssr with AstroCookies + Request headers so
 *                  the session cookie is read/written on every SSR request.
 * Browser client : singleton created once per page load; safe to call
 *                  multiple times from React islands.
 *
 * Usage (server — Astro pages):
 *   const supabase = createServerClient(Astro.request, Astro.cookies);
 *
 * Usage (server — API routes / middleware):
 *   const supabase = createServerClient(context.request, context.cookies);
 *
 * Usage (browser — React islands):
 *   const supabase = getBrowserClient();
 */

import { createServerClient as createSSRServerClient, createBrowserClient as createSSRBrowserClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import type { Database } from './types';

// ── Environment variables ─────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY environment variables. ' +
      'Copy .env.example to .env.local and fill in the values.',
  );
}

// ── Server client ─────────────────────────────────────────────────────────────

/**
 * Creates a typed Supabase client for server-side usage (SSR pages, API
 * routes, middleware). Reads cookies from the `Request` headers and writes
 * back via `AstroCookies` so auth state is always up-to-date.
 *
 * A new instance must be created per request — do NOT cache or share.
 */
export function createServerClient(
  request: Request,
  cookies: AstroCookies,
): SupabaseClient<Database> {
  return createSSRServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        // parseCookieHeader returns `value?: string`; filter to satisfy GetAllCookies
        return parseCookieHeader(request.headers.get('Cookie') ?? '').filter(
          (c): c is { name: string; value: string } => c.value !== undefined,
        );
      },
      setAll(cookiesToSet) {
        // second argument `headers` (Cache-Control etc.) is not needed for Astro SSR
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}

// ── Browser client (singleton) ────────────────────────────────────────────────

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Returns a singleton Supabase browser client.
 *
 * Safe to call from multiple React islands on the same page — only one
 * instance is ever created, preventing memory leaks and duplicate auth
 * listeners.
 *
 * Must only be called in browser context (client:load / client:idle islands).
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createSSRBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

// ── Re-export types for convenience ──────────────────────────────────────────

export type { Database } from './types';
export type { SupabaseClient };
