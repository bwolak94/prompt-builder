/**
 * Auth guards for API routes.
 *
 * Usage:
 *   const authResult = requireAuth(locals);
 *   if (authResult instanceof Response) return authResult;
 *   const { user, supabase } = authResult;
 *
 *   const proResult = await requirePro(locals);
 *   if (proResult instanceof Response) return proResult;
 */

import type { SupabaseClient } from '@/db/supabase.client';
import type { User } from '@supabase/supabase-js';
import { unauthorized, forbidden } from './response';

interface AuthLocals {
  user: User | null;
  supabase: SupabaseClient;
}

interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

/** Returns AuthResult or a 401 Response if not authenticated. */
export function requireAuth(locals: AuthLocals): AuthResult | Response {
  if (!locals.user) return unauthorized();
  return { user: locals.user, supabase: locals.supabase };
}

/** Returns AuthResult or a 401/403 Response. Checks `plan = 'pro'` in profiles. */
export async function requirePro(locals: AuthLocals): Promise<AuthResult | Response> {
  if (!locals.user) return unauthorized();

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('plan')
    .eq('id', locals.user.id)
    .single();

  if (profile?.plan !== 'pro') {
    return forbidden('This feature requires a Pro plan');
  }

  return { user: locals.user, supabase: locals.supabase };
}
