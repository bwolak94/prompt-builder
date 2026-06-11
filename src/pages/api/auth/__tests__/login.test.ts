import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/types';

import { POST as login } from '../login';
import { POST as logout } from '../logout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSignInMock(result: unknown) {
  return {
    auth: { signInWithPassword: vi.fn().mockResolvedValue(result) },
  } as unknown as SupabaseClient<Database>;
}

function makeSignOutMock(result: unknown) {
  return {
    auth: { signOut: vi.fn().mockResolvedValue(result) },
  } as unknown as SupabaseClient<Database>;
}

function makeLoginRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeLogoutRequest(): Request {
  return new Request('http://localhost/api/auth/logout', { method: 'POST' });
}

function makeContext(request: Request, supabase: SupabaseClient<Database>) {
  return {
    request,
    locals: { supabase } as unknown as App.Locals,
  } as Parameters<typeof login>[0];
}

const validCredentials = { email: 'user@example.com', password: 'Secret123' };

// ── Login tests ───────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 and the user on successful login', async () => {
    const mockUser = { id: 'user-1', email: validCredentials.email };
    const supabase = makeSignInMock({
      data: { user: mockUser, session: { access_token: 'tok' } },
      error: null,
    });

    const response = await login(makeContext(makeLoginRequest(validCredentials), supabase));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user.id).toBe('user-1');
  });

  it('calls signInWithPassword with the provided credentials', async () => {
    const mockUser = { id: 'user-1', email: validCredentials.email };
    const supabase = makeSignInMock({
      data: { user: mockUser, session: null },
      error: null,
    });

    await login(makeContext(makeLoginRequest(validCredentials), supabase));

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: validCredentials.email,
      password: validCredentials.password,
    });
  });

  it('returns 401 for invalid credentials', async () => {
    const supabase = makeSignInMock({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });

    const response = await login(makeContext(makeLoginRequest(validCredentials), supabase));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('INVALID_CREDENTIALS');
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns 401 for wrong password (status 400)', async () => {
    const supabase = makeSignInMock({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed', status: 400 },
    });

    const response = await login(makeContext(makeLoginRequest(validCredentials), supabase));

    expect(response.status).toBe(401);
  });

  it('returns 422 for missing email', async () => {
    const supabase = makeSignInMock({ data: { user: null, session: null }, error: null });
    const request = makeLoginRequest({ password: 'Secret123' });

    const response = await login(makeContext(request, supabase));

    expect(response.status).toBe(422);
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('returns 422 for invalid email format', async () => {
    const supabase = makeSignInMock({ data: { user: null, session: null }, error: null });
    const request = makeLoginRequest({ email: 'not-an-email', password: 'Secret123' });

    const response = await login(makeContext(request, supabase));

    expect(response.status).toBe(422);
  });

  it('returns 400 for malformed JSON', async () => {
    const supabase = makeSignInMock({ data: { user: null, session: null }, error: null });
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const response = await login(makeContext(request, supabase));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_JSON');
  });

  it('returns 400 for unexpected Supabase errors (non-400 status)', async () => {
    const supabase = makeSignInMock({
      data: { user: null, session: null },
      error: { message: 'Server error', status: 500 },
    });

    const response = await login(makeContext(makeLoginRequest(validCredentials), supabase));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('AUTH_ERROR');
  });
});

// ── Logout tests ──────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on successful logout', async () => {
    const supabase = makeSignOutMock({ error: null });
    const ctx = makeContext(makeLogoutRequest(), supabase);

    const response = await logout(ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.success).toBe(true);
  });

  it('calls signOut', async () => {
    const supabase = makeSignOutMock({ error: null });
    const ctx = makeContext(makeLogoutRequest(), supabase);

    await logout(ctx);

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('returns 400 if signOut fails', async () => {
    const supabase = makeSignOutMock({
      error: { message: 'Session not found' },
    });
    const ctx = makeContext(makeLogoutRequest(), supabase);

    const response = await logout(ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('AUTH_ERROR');
  });
});
