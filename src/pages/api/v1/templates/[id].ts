import type { APIRoute } from 'astro';
import { ok, notFound } from '@/lib/api/response';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) return notFound('Template not found');

  const { data, error } = await locals.supabase
    .from('system_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return notFound('Template not found');
  return ok(data);
};
