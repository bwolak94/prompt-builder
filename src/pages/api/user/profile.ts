import type { APIRoute } from 'astro';
import { z } from 'zod';
import { profileService } from '@/lib/services/profile.service';

export const prerender = false;

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, 'Tylko małe litery, cyfry, _ i -')
    .optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.url().optional(),
  preferences: z
    .object({
      defaultModel: z.enum(['openai', 'anthropic']).optional(),
      language: z.enum(['pl', 'en']).optional(),
    })
    .optional(),
});

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Validation error' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Check username uniqueness if provided
  if (parsed.data.username) {
    const taken = await profileService.isUsernameTaken(
      locals.supabase,
      parsed.data.username,
      user.id,
    );
    if (taken) {
      return new Response(JSON.stringify({ error: 'Ta nazwa użytkownika jest już zajęta.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const profile = await profileService.updateProfile(locals.supabase, user.id, parsed.data);
    return new Response(JSON.stringify({ data: profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
