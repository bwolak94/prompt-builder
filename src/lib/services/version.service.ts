/**
 * VersionService — manages prompt version snapshots.
 *
 * Responsibilities (S):
 *   - Create version via atomic Postgres function
 *   - Restore a version (update prompt + create a new "restore" version)
 *
 * Does NOT handle HTTP — that's the API route's job.
 */

import type { SupabaseClient } from '@/db/supabase.client';
import { versionRepo, type PromptVersion } from '@/db/repositories/version.repo';
import { promptService } from '@/lib/services/prompt.service';
import type { Prompt } from '@/types';

export const versionService = {
  /**
   * Create a new version snapshot from the current prompt state.
   * Calls the atomic `create_prompt_version()` Postgres function which
   * handles auto-incrementing and free-tier pruning.
   */
  async createVersion(
    supabase: SupabaseClient,
    userId: string,
    prompt: Prompt,
    summary?: string,
  ): Promise<PromptVersion> {
    return versionRepo.create(supabase, {
      promptId: prompt.id,
      userId,
      title: prompt.title,
      description: prompt.description,
      blocks: prompt.blocks,
      variables: prompt.variables,
      contentMd: prompt.content_md,
      tags: prompt.tags,
      summary,
    });
  },

  /**
   * Restore a version: update the live prompt with version's content,
   * then create a new version entry ("Restored from v{N}") so history is preserved.
   */
  async restoreVersion(
    supabase: SupabaseClient,
    promptId: string,
    versionId: string,
    userId: string,
  ): Promise<Prompt> {
    // Load the version to restore
    const version = await versionRepo.findById(supabase, versionId);
    if (!version) throw new Error('Version not found');
    if (version.prompt_id !== promptId) throw new Error('Version does not belong to this prompt');

    // Update the live prompt — updatePrompt verifies ownership (throws 'Forbidden')
    const updated = await promptService.updatePrompt(supabase, promptId, userId, {
      title: version.title,
      description: version.description ?? undefined,
      blocks: version.blocks,
      variables: version.variables,
      tags: version.tags,
    });

    // Create a new version marking the restore (fire-and-forget the version entry)
    void versionRepo.create(supabase, {
      promptId,
      userId,
      title: version.title,
      description: version.description,
      blocks: version.blocks,
      variables: version.variables,
      contentMd: version.content_md,
      tags: version.tags,
      summary: `Przywrócono z wersji #${version.version_number}`,
    });

    return updated;
  },
};
