import type { APIRoute } from 'astro';
import { promptService } from '@/lib/services/prompt.service';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  try {
    const forked = await promptService.forkPrompt(locals.supabase, id, user.id);
    return new Response(JSON.stringify({ data: forked }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Prompt not found') {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: 'Failed to fork prompt' }), { status: 500 });
  }
};
