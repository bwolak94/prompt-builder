import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created } from '@/lib/api/response';
import { userApiKeysRepo } from '@/db/repositories/user-api-keys.repo';
import { encryptApiKey, makeKeyHint } from '@/lib/crypto/encrypt';

export const prerender = false;

const SaveKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  apiKey: z.string().min(1).max(500),
  label: z.string().max(100).default(''),
});

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const keys = await userApiKeysRepo.findByUser(auth.supabase, auth.user.id);
  return ok(keys);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, SaveKeySchema);
  if (parsed instanceof Response) return parsed;

  const { provider, apiKey, label } = parsed;

  const keyEncrypted = await encryptApiKey(apiKey);
  const keyHint = makeKeyHint(apiKey);

  const saved = await userApiKeysRepo.upsert(
    auth.supabase,
    auth.user.id,
    provider,
    keyEncrypted,
    keyHint,
    label,
  );

  return created(saved);
};
