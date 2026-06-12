/**
 * POST /api/lang
 * Sets the `lang` cookie and redirects back to the referring page.
 *
 * Body: { lang: 'pl' | 'en' }
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const lang = body.lang === 'en' ? 'en' : 'pl';

  const referer = request.headers.get('referer') ?? '/';
  const url = new URL(referer);
  const redirectTo = url.pathname + url.search;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
    },
  });
};
