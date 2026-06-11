import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = locals.supabase;

  // Fetch prompts summary
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id,is_public,fork_count')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  type PromptRow = { id: string; is_public: boolean; fork_count: number | null };
  const rows = (prompts ?? []) as PromptRow[];
  const promptIds = rows.map((p) => p.id);
  const total = promptIds.length;
  const publicCount = rows.filter((p) => p.is_public).length;
  const forks = rows.reduce((sum: number, p: PromptRow) => sum + (p.fork_count ?? 0), 0);

  // Average AI score
  let avgScore: number | null = null;
  if (promptIds.length > 0) {
    const { data: ratings } = await supabase
      .from('prompt_ratings')
      .select('overall_score')
      .in('prompt_id', promptIds);

    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((acc: number, r: { overall_score: number }) => acc + r.overall_score, 0);
      avgScore = Math.round(sum / ratings.length);
    }
  }

  return new Response(
    JSON.stringify({ data: { total, public: publicCount, forks, avgScore } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
