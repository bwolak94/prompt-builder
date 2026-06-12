import type { SupabaseClient } from '@/db/supabase.client';
import type { PromptBlock, PromptVariable } from '@/types';
import type { Json } from '@/db/types';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  description: string | null;
  blocks: PromptBlock[];
  variables: PromptVariable[];
  content_md: string;
  tags: string[];
  change_summary: string | null;
  created_at: string;
}

export interface PromptVersionSummary {
  id: string;
  version_number: number;
  title: string;
  change_summary: string | null;
  created_at: string;
  /** First 100 chars of content_md for quick preview */
  preview: string;
}

export interface CreateVersionData {
  promptId: string;
  userId: string;
  title: string;
  description: string | null;
  blocks: PromptBlock[];
  variables: PromptVariable[];
  contentMd: string;
  tags: string[];
  summary?: string;
}

function mapRow(row: {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  description: string | null;
  blocks: Json;
  variables: Json;
  content_md: string;
  tags: string[];
  change_summary: string | null;
  created_at: string;
}): PromptVersion {
  return {
    id: row.id,
    prompt_id: row.prompt_id,
    version_number: row.version_number,
    title: row.title,
    description: row.description,
    blocks: row.blocks as unknown as PromptBlock[],
    variables: row.variables as unknown as PromptVariable[],
    content_md: row.content_md,
    tags: row.tags,
    change_summary: row.change_summary,
    created_at: row.created_at,
  };
}

export const versionRepo = {
  /** List all version summaries for a prompt (newest first, no blocks). */
  async findByPrompt(supabase: SupabaseClient, promptId: string): Promise<PromptVersionSummary[]> {
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id, version_number, title, change_summary, created_at, content_md')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false });

    if (error) throw new Error(`Failed to list versions: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      version_number: row.version_number,
      title: row.title,
      change_summary: row.change_summary,
      created_at: row.created_at,
      preview: row.content_md.slice(0, 100),
    }));
  },

  /** Get a single full version by ID. */
  async findById(supabase: SupabaseClient, versionId: string): Promise<PromptVersion | null> {
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error || !data) return null;
    return mapRow(data as Parameters<typeof mapRow>[0]);
  },

  /** Get the previous version (one before the given version_number). */
  async findPrevious(
    supabase: SupabaseClient,
    promptId: string,
    versionNumber: number,
  ): Promise<PromptVersion | null> {
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .lt('version_number', versionNumber)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return mapRow(data as Parameters<typeof mapRow>[0]);
  },

  /** Create a new version via the atomic Postgres function. */
  async create(supabase: SupabaseClient, data: CreateVersionData): Promise<PromptVersion> {
    const { data: result, error } = await supabase.rpc('create_prompt_version', {
      p_prompt_id: data.promptId,
      p_user_id: data.userId,
      p_title: data.title,
      p_description: data.description ?? '',
      p_blocks: data.blocks as unknown as Json,
      p_variables: data.variables as unknown as Json,
      p_content_md: data.contentMd,
      p_tags: data.tags,
      p_summary: data.summary ?? null,
    });

    if (error) throw new Error(`Failed to create version: ${error.message}`);
    if (!result) throw new Error('create_prompt_version returned no data');

    return mapRow(result as unknown as Parameters<typeof mapRow>[0]);
  },

  /** Count versions for a prompt. */
  async countByPrompt(supabase: SupabaseClient, promptId: string): Promise<number> {
    const { count, error } = await supabase
      .from('prompt_versions')
      .select('id', { count: 'exact', head: true })
      .eq('prompt_id', promptId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};
