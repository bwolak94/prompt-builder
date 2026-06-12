import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/auth';
import { parseBody } from '@/lib/api/validate';
import { ok, created, error } from '@/lib/api/response';
import { apiKeyRepo } from '@/db/repositories/api-key.repo';
import { generateApiKey, getKeyPrefix, getKeySuffix } from '@/lib/api-key/generator';
import { hashApiKey } from '@/lib/api-key/hasher';

export const prerender = false;

const MAX_KEYS = 5;

const CreateKeySchema = z.object({
  label: z.string().min(1).max(100),
});

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const keys = await apiKeyRepo.findByUser(auth.supabase, auth.user.id);
  return ok(keys);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(request, CreateKeySchema);
  if (parsed instanceof Response) return parsed;

  const count = await apiKeyRepo.countByUser(auth.supabase, auth.user.id);
  if (count >= MAX_KEYS) {
    return error('Maximum 5 API keys allowed', 400, 'MAX_KEYS');
  }

  const plaintext = generateApiKey();
  const keyHash = await hashApiKey(plaintext);
  const keyPrefix = getKeyPrefix();
  const keySuffix = getKeySuffix(plaintext);

  const key = await apiKeyRepo.create(auth.supabase, {
    userId: auth.user.id,
    keyHash,
    keyPrefix,
    keySuffix,
    label: parsed.label,
  });

  // Return plaintext key ONCE — never stored
  return created({ ...key, plaintext_key: plaintext });
};
