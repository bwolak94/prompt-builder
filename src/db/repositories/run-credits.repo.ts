import type { SupabaseClient } from '@/db/supabase.client';

export interface RunCreditsStatus {
  used: number;
  monthlyLimit: number;
  /** -1 means unlimited */
  remaining: number;
  month: string;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export const runCreditsRepo = {
  /** Atomically check limit and increment. Returns allowed + remaining. */
  async checkAndIncrement(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const { data, error } = await supabase.rpc('check_and_increment_run_credits', {
      p_user_id: userId,
      p_month: currentMonth(),
    });

    if (error) throw new Error(`Credits check failed: ${error.message}`);

    const result = data?.[0];
    return {
      allowed: result?.allowed ?? false,
      remaining: result?.remaining ?? 0,
    };
  },

  /** Get current credits status (without incrementing). */
  async getStatus(supabase: SupabaseClient, userId: string): Promise<RunCreditsStatus> {
    const month = currentMonth();
    const { data } = await supabase
      .from('run_credits')
      .select('used, monthly_limit')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    const used = data?.used ?? 0;
    const monthlyLimit = data?.monthly_limit ?? 50;
    const remaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - used);

    return { used, monthlyLimit, remaining, month };
  },

  /** Set unlimited credits for a pro user (monthly_limit = -1). */
  async setUnlimited(supabase: SupabaseClient, userId: string): Promise<void> {
    const month = currentMonth();
    await supabase
      .from('run_credits')
      .upsert({ user_id: userId, month, monthly_limit: -1 }, { onConflict: 'user_id,month' });
  },
};
