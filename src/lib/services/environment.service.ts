import type { SupabaseClient } from '@/db/supabase.client';
import { environmentRepo, type PromptEnv, type PromptEnvironment } from '@/db/repositories/environment.repo';
import { versionRepo } from '@/db/repositories/version.repo';

export const environmentService = {
  /**
   * Get all environments for a prompt (dev, staging, production).
   */
  async getAll(supabase: SupabaseClient, promptId: string): Promise<PromptEnvironment[]> {
    return environmentRepo.findByPrompt(supabase, promptId);
  },

  /**
   * Get a single environment entry.
   */
  async get(
    supabase: SupabaseClient,
    promptId: string,
    env: PromptEnv,
  ): Promise<PromptEnvironment | null> {
    return environmentRepo.findByPromptAndEnv(supabase, promptId, env);
  },

  /**
   * Automatically sync the dev environment to the latest version.
   * Called after a prompt is saved/version created.
   */
  async syncDev(
    supabase: SupabaseClient,
    promptId: string,
    versionId: string,
    userId: string,
  ): Promise<void> {
    const version = await versionRepo.findById(supabase, versionId);
    if (!version) return;

    await environmentRepo.upsert(supabase, {
      prompt_id: promptId,
      environment: 'dev',
      version_id: versionId,
      version_number: version.version_number,
      content_md: version.content_md,
      blocks: version.blocks,
      promoted_by: userId,
    });
  },

  /**
   * Promote a version to a target environment.
   * Pro plan required for staging/production.
   */
  async promote(
    supabase: SupabaseClient,
    promptId: string,
    targetEnv: 'staging' | 'production',
    versionId: string,
    userId: string,
    plan: string,
  ): Promise<PromptEnvironment> {
    if (plan !== 'pro') {
      throw new Error('Staging and production environments require Pro plan');
    }

    const version = await versionRepo.findById(supabase, versionId);
    if (!version) throw new Error('Version not found');

    // Determine from_env for audit log
    const fromEnv: PromptEnv = targetEnv === 'production' ? 'staging' : 'dev';

    const env = await environmentRepo.upsert(supabase, {
      prompt_id: promptId,
      environment: targetEnv,
      version_id: versionId,
      version_number: version.version_number,
      content_md: version.content_md,
      blocks: version.blocks,
      promoted_by: userId,
    });

    await environmentRepo.insertPromotion(supabase, {
      prompt_id: promptId,
      from_env: fromEnv,
      to_env: targetEnv,
      version_id: versionId,
      promoted_by: userId,
    });

    return env;
  },

  async listPromotions(supabase: SupabaseClient, promptId: string) {
    return environmentRepo.listPromotions(supabase, promptId);
  },
};
