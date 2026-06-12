import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ok, noContent, notFound, forbidden, error, unauthorized } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { promptRepo } from '@/db/repositories/prompt.repo';
import { promptService } from '@/lib/services/prompt.service';
import { environmentRepo } from '@/db/repositories/environment.repo';

export const prerender = false;

const UpdatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  blocks: z.array(z.unknown()).optional(),
  variables: z.array(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
}).partial();

export const GET: APIRoute = async ({ params, locals, url }) => {
  if (!locals.apiUser) return unauthorized();

  const { id } = params;
  if (!id) return notFound('Prompt not found');

  const env = url.searchParams.get('env');

  const prompt = await promptRepo.findById(locals.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== locals.apiUser.userId) return forbidden();

  // If env param provided, return version for that environment
  if (env && (env === 'dev' || env === 'staging' || env === 'production')) {
    const envData = await environmentRepo.findByPromptAndEnv(locals.supabase, id, env);
    if (!envData?.content_md) {
      return error(`No version promoted to ${env}`, 404, 'NO_ENV_VERSION');
    }
    return ok({
      ...prompt,
      content_md: envData.content_md,
      blocks: envData.blocks ?? prompt.blocks,
      version: envData.version_number,
      environment: env,
    });
  }

  return ok(prompt);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.apiUser) return unauthorized();

  const { id } = params;
  if (!id) return notFound('Prompt not found');

  const parsed = await parseBody(request, UpdatePromptSchema);
  if (parsed instanceof Response) return parsed;

  const updated = await promptService.updatePrompt(
    locals.supabase,
    id,
    locals.apiUser.userId,
    {
      ...(parsed.title !== undefined && { title: parsed.title }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.blocks !== undefined && { blocks: parsed.blocks as import('@/types').PromptBlock[] }),
      ...(parsed.variables !== undefined && { variables: parsed.variables as import('@/types').PromptVariable[] }),
      ...(parsed.tags !== undefined && { tags: parsed.tags }),
      ...(parsed.is_public !== undefined && { is_public: parsed.is_public }),
    },
  );
  return ok(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.apiUser) return unauthorized();

  const { id } = params;
  if (!id) return notFound('Prompt not found');

  const prompt = await promptRepo.findById(locals.supabase, id);
  if (!prompt) return notFound('Prompt not found');
  if (prompt.user_id !== locals.apiUser.userId) return forbidden();

  await promptRepo.softDelete(locals.supabase, id);
  return noContent();
};
