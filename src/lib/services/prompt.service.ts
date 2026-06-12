import type { SupabaseClient } from '@/db/supabase.client';
import type { Prompt, CreatePromptDto, UpdatePromptDto } from '@/types';
import type { Json } from '@/db/types';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { templateRepo } from '@/db/repositories/template.repo';
import { blocksToMarkdown, generateSlug } from '@/lib/markdown';

// ── Slug generation with retry ─────────────────────────────────────────────────

async function generateUniqueSlug(
  supabase: SupabaseClient,
  title: string,
  maxAttempts = 3,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateSlug(title);
    const taken = await promptRepo.slugExists(supabase, candidate);
    if (!taken) return candidate;
  }
  // If all attempts collide (extremely rare), use a final fallback
  return generateSlug(`${title} ${Date.now()}`);
}

// ── Service ────────────────────────────────────────────────────────────────────

export const promptService = {
  async createPrompt(
    supabase: SupabaseClient,
    userId: string,
    dto: CreatePromptDto,
  ): Promise<Prompt> {
    const content_md = blocksToMarkdown(dto.blocks);

    let slug: string | undefined;
    if (dto.is_public) {
      slug = dto.slug ?? (await generateUniqueSlug(supabase, dto.title));
    }

    return promptRepo.create(supabase, {
      user_id: userId,
      title: dto.title,
      description: dto.description ?? null,
      blocks: dto.blocks as unknown as Json,
      variables: (dto.variables ?? []) as unknown as Json,
      content_md,
      tags: dto.tags ?? [],
      is_public: dto.is_public,
      slug: slug ?? null,
    });
  },

  async updatePrompt(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    dto: UpdatePromptDto,
  ): Promise<Prompt> {
    const existing = await promptRepo.findById(supabase, id);
    if (!existing) throw new Error('Prompt not found');
    if (existing.user_id !== userId) throw new Error('Forbidden');

    const blocks = dto.blocks ?? existing.blocks;
    const content_md = dto.blocks ? blocksToMarkdown(blocks) : existing.content_md;

    let slug = existing.slug;
    if (dto.is_public && !existing.is_public && !slug) {
      slug = await generateUniqueSlug(supabase, dto.title ?? existing.title);
    }

    return promptRepo.update(supabase, id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description ?? null }),
      ...(dto.blocks !== undefined && {
        blocks: dto.blocks as unknown as Json,
        content_md,
      }),
      ...(dto.variables !== undefined && {
        variables: dto.variables as unknown as Json,
      }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.is_public !== undefined && { is_public: dto.is_public }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
      ...(slug !== existing.slug && { slug }),
    });
  },

  async deletePrompt(supabase: SupabaseClient, id: string, userId: string): Promise<void> {
    const existing = await promptRepo.findById(supabase, id);
    if (!existing) throw new Error('Prompt not found');
    if (existing.user_id !== userId) throw new Error('Forbidden');
    await promptRepo.softDelete(supabase, id);
  },

  async forkPrompt(supabase: SupabaseClient, id: string, userId: string): Promise<Prompt> {
    // Look up in user prompts first, then fall back to system templates
    const sourcePrompt = await promptRepo.findById(supabase, id);
    const sourceTemplate = sourcePrompt ? null : await templateRepo.findById(supabase, id);
    const source = sourcePrompt ?? sourceTemplate;
    if (!source) throw new Error('Prompt not found');

    const forked = await promptRepo.create(supabase, {
      user_id: userId,
      title: `${source.title} (fork)`,
      description: source.description,
      blocks: source.blocks as unknown as Json,
      variables: source.variables as unknown as Json,
      content_md: source.content_md,
      tags: source.tags,
      is_public: false,
      slug: null,
      // fork_of references prompts(id) — only set for user-prompt forks, not system templates
      fork_of: sourcePrompt ? source.id : null,
    });

    // fire-and-forget: increment fork_count on the source
    if (sourcePrompt) {
      promptRepo.incrementForkCount(supabase, source.id);
    } else {
      supabase
        .from('system_templates')
        .update({ fork_count: (source.fork_count ?? 0) + 1 })
        .eq('id', source.id);
    }

    return forked;
  },

  async getPromptsByUser(supabase: SupabaseClient, userId: string): Promise<Prompt[]> {
    return promptRepo.findByUserId(supabase, userId);
  },

  async getPublicPrompt(supabase: SupabaseClient, slug: string): Promise<Prompt | null> {
    const prompt = await promptRepo.findBySlug(supabase, slug);
    if (!prompt || !prompt.is_public) return null;
    // fire-and-forget view count increment
    promptRepo.incrementViewCount(supabase, prompt.id);
    return prompt;
  },
};
