/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Typed Supabase server client — unique per request */
    supabase: import('@supabase/supabase-js').SupabaseClient<import('@/db/types').Database>;
    /** Active session (access + refresh tokens), or null if logged out */
    session: import('@supabase/supabase-js').Session | null;
    /** Authenticated user object, or null if logged out */
    user: import('@supabase/supabase-js').User | null;
    /** Active UI language — read from `lang` cookie */
    lang: import('@/lib/i18n').Lang;
  }
}

interface ImportMetaEnv {
  // Supabase — public (safe to expose to browser)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  // Supabase — server-only secrets
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  // AI providers
  readonly OPENAI_API_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
  readonly AI_SCORE_PROVIDER: 'openai' | 'anthropic';
  // Run prompt (F-01)
  readonly GEMINI_API_KEY: string;
  /** 64-char hex string (32 bytes) for AES-256-GCM BYOK key encryption */
  readonly ENCRYPTION_KEY: string;
  // Site
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
