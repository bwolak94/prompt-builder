/// <reference path="../.astro/types.d.ts" />

// App.Locals is extended in src/middleware/index.ts (TASK-008)
// Defined here as the canonical interface for TypeScript awareness
declare namespace App {
  interface Locals {
    // Populated by middleware after TASK-008
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
