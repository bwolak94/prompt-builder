import type { APIRoute } from 'astro';
import type { ApiResponse } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  // signOut() invalidates the session server-side and the SSR client clears
  // the session cookie automatically via the setAll callback.
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    return json<ApiResponse<never>>({ error: error.message, code: 'AUTH_ERROR' }, 400);
  }

  return json<ApiResponse<{ success: true }>>({ data: { success: true } }, 200);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
