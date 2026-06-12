import type { APIRoute } from 'astro';
import { ok, unauthorized, error } from '@/lib/api/response';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.apiUser) return unauthorized();

  const { data: profile, error: pErr } = await locals.supabase
    .from('profiles')
    .select('id, display_name, plan, created_at')
    .eq('id', locals.apiUser.userId)
    .single();

  if (pErr || !profile) return error('Profile not found', 404);

  // Aggregate prompt stats
  const { count: total } = await locals.supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', locals.apiUser.userId);

  const { count: publicCount } = await locals.supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', locals.apiUser.userId)
    .eq('is_public', true);

  return ok({
    id: profile.id,
    display_name: profile.display_name,
    plan: profile.plan,
    stats: {
      total: total ?? 0,
      public: publicCount ?? 0,
    },
  });
};
