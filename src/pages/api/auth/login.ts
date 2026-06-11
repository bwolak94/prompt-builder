import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import type { User } from '@supabase/supabase-js';

export const prerender = false;

// ── Validation schema ─────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ locals, request }) => {
  // ── 1. Parse and validate body ────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json<ApiResponse<never>>({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Validation error';
    return json<ApiResponse<never>>({ error: message, code: 'VALIDATION_ERROR' }, 422);
  }

  const { email, password } = parsed.data;

  // ── 2. Sign in ────────────────────────────────────────────────────────────
  // The SSR client writes the session cookie automatically via setAll.
  const { data, error } = await locals.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Supabase returns "Invalid login credentials" for wrong email/password
    const isInvalidCredentials =
      error.message.toLowerCase().includes('invalid login') ||
      error.message.toLowerCase().includes('invalid credentials') ||
      error.status === 400;

    if (isInvalidCredentials) {
      return json<ApiResponse<never>>(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        401,
      );
    }

    return json<ApiResponse<never>>({ error: error.message, code: 'AUTH_ERROR' }, 400);
  }

  return json<ApiResponse<{ user: User }>>({ data: { user: data.user } }, 200);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
