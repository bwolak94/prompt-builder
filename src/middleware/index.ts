import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@/db/supabase.client';
import { parseLangCookie, type Lang } from '@/lib/i18n';
import { hashApiKey } from '@/lib/api-key/hasher';

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

  // ── 0. Public REST API v1 — Bearer token auth ───────────────────────────────
  if (url.pathname.startsWith('/api/v1/')) {
    // /api/v1/templates is public (no auth required)
    if (url.pathname.startsWith('/api/v1/templates')) {
      locals.supabase = createServerClient(request, cookies);
      locals.lang = 'en' as Lang;
      const response = await next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const plainKey = authHeader.slice(7).trim();
    const keyHash = await hashApiKey(plainKey);

    // Use a temporary supabase client (anon key is fine for the RPC call)
    const tempSupabase = createServerClient(request, cookies);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (tempSupabase as any).rpc('verify_api_key_and_check_limit', {
      p_key_hash: keyHash,
    });

    type ApiKeyResult = { is_allowed: boolean; user_id: string; remaining: number } | null;
    const result: ApiKeyResult = Array.isArray(data) ? (data[0] as ApiKeyResult) : (data as ApiKeyResult);

    if (!result?.is_allowed) {
      const status = result ? 429 : 401;
      return new Response(
        JSON.stringify({ error: status === 429 ? 'Rate limit exceeded. Resets at midnight UTC.' : 'Invalid API key' }),
        {
          status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    locals.apiUser = { userId: result.user_id };
    locals.supabase = tempSupabase;
    locals.lang = 'en' as Lang;

    const response = await next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining ?? 0));
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

  // ── 1. Resolve language from cookie ────────────────────────────────────────
  const cookieHeader = request.headers.get('cookie');
  locals.lang = parseLangCookie(cookieHeader) as Lang;

  // ── 2. Attach a fresh Supabase client to every request ─────────────────────
  // createServerClient reads the session cookie from request headers and
  // writes refreshed tokens back via AstroCookies before the response is sent.
  locals.supabase = createServerClient(request, cookies);

  // ── 3. Resolve the current session (auto-refreshes via refresh token) ───────
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

  // ── 4. Auth guard ───────────────────────────────────────────────────────────
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

  // ── 5. Pass through ─────────────────────────────────────────────────────────
  return next();
});
