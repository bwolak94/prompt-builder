import type { APIRoute } from 'astro';
import { chainRepo } from '@/db/repositories/chain.repo';
import { generateExport, type ExportLang } from '@/lib/services/chain-export.service';

export const prerender = false;

// GET /api/chains/[id]/export?lang=python|javascript
export const GET: APIRoute = async ({ params, url, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const chain = await chainRepo.findById(locals.supabase, params.id!);
  if (!chain) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (chain.user_id !== locals.user.id && !chain.is_public) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const lang = (url.searchParams.get('lang') ?? 'python') as ExportLang;
  if (!['python', 'javascript'].includes(lang)) {
    return new Response(JSON.stringify({ error: 'lang must be python or javascript' }), { status: 422 });
  }

  const code = generateExport(lang, chain.title, chain.nodes);
  return new Response(JSON.stringify({ data: { code, lang } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
