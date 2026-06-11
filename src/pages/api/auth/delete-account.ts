import type { APIRoute } from 'astro';

export const prerender = false;

export const DELETE: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Soft-delete all user prompts
  await locals.supabase
    .from('prompts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('deleted_at', null);

  // Sign out
  await locals.supabase.auth.signOut();

  // Note: full account deletion requires a Supabase Admin API call with service_role key.
  // For now we sign out and soft-delete data. A background job or edge function
  // can handle the actual auth.users row deletion via admin.deleteUser().
  return new Response(JSON.stringify({ data: { ok: true } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
