import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@/db/supabase.client';

/**
 * Routes that require an authenticated session.
 * Unauthenticated page visits → redirect to /login?redirect=<path>
 * Unauthenticated API calls  → 401 JSON
 */
const PROTECTED_ROUTES = ['/dashboard', '/builder', '/settings'];

/**
 * Returns true when the pathname is under a protected prefix.
 * Matches exactly or as a path prefix (e.g. /builder/123 is protected).
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Returns true for all /api/* paths */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, locals, url } = context;

  // ── 1. Attach a fresh Supabase client to every request ─────────────────────
  // createServerClient reads the session cookie from request headers and
  // writes refreshed tokens back via AstroCookies before the response is sent.
  locals.supabase = createServerClient(request, cookies);

  // ── 2. Resolve the current session (auto-refreshes via refresh token) ───────
  // getUser() validates the JWT with the Supabase auth server — more secure
  // than getSession() which only reads the local cookie.
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();

  if (error) {
    // Token is invalid / expired beyond refresh — treat as logged out
    locals.user = null;
    locals.session = null;
  } else {
    locals.user = user;

    // Populate session from the cookie so pages can read access_token if needed
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();
    locals.session = session;
  }

  // ── 3. Auth guard ───────────────────────────────────────────────────────────
  const { pathname } = url;

  if (locals.user === null && isProtectedRoute(pathname)) {
    if (isApiRoute(pathname)) {
      // API routes return JSON 401 — never redirect
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Page routes redirect to login with the original path as return destination
    const loginUrl = new URL('/login', url);
    loginUrl.searchParams.set('redirect', pathname);
    return context.redirect(loginUrl.toString(), 302);
  }

  // ── 4. Pass through ─────────────────────────────────────────────────────────
  return next();
});
