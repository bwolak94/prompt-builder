import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const Schema = z.object({
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { error } = await locals.supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data: { ok: true } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
