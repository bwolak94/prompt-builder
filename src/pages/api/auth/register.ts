import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import type { User } from '@supabase/supabase-js';

export const prerender = false;

// ── Validation schema ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Validation error';
    return json<ApiResponse<never>>({ error: message, code: 'VALIDATION_ERROR' }, 422);
  }

  const { email, password, displayName } = parsed.data;

  // ── 2. Register with Supabase Auth ────────────────────────────────────────
  // The `handle_new_user` trigger creates the profile row automatically.
  // The SSR client writes the session cookie via the setAll callback in
  // createServerClient, so no manual cookie handling is needed here.
  const { data, error } = await locals.supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    // Supabase returns "User already registered" for duplicate emails
    const isDuplicate =
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists');

    if (isDuplicate) {
      return json<ApiResponse<never>>({ error: 'Email already in use', code: 'EMAIL_TAKEN' }, 409);
    }

    return json<ApiResponse<never>>({ error: error.message, code: 'AUTH_ERROR' }, 400);
  }

  if (!data.user) {
    // Supabase may return null user when email confirmation is required
    return json<ApiResponse<never>>(
      { error: 'Registration pending email confirmation', code: 'EMAIL_CONFIRMATION_REQUIRED' },
      202,
    );
  }

  // ── 3. Return the created user ────────────────────────────────────────────
  return json<ApiResponse<{ user: User }>>({ data: { user: data.user } }, 201);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
