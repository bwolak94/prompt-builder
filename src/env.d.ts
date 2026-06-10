/// <reference path="../.astro/types.d.ts" />

import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/types';

declare namespace App {
  interface Locals {
    /** Typed Supabase server client — unique per request */
    supabase: SupabaseClient<Database>;
    /** Active session (access + refresh tokens), or null if logged out */
    session: Session | null;
    /** Authenticated user object, or null if logged out */
    user: User | null;
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
  // Site
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
