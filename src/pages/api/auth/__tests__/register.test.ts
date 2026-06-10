import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/types';

import { POST } from '../register';

// ── Helpers ───────────────────────────────────────────────────────────────────

type SignUpResult = Awaited<ReturnType<SupabaseClient<Database>['auth']['signUp']>>;

function makeSupabaseMock(result: SignUpResult) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(result),
    },
  } as unknown as SupabaseClient<Database>;
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(request: Request, supabase: SupabaseClient<Database>) {
  return {
    request,
    locals: { supabase } as unknown as App.Locals,
  } as Parameters<typeof POST>[0];
}

const validBody = {
  email: 'user@example.com',
  password: 'SecurePass1',
  displayName: 'Test User',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Successful registration ────────────────────────────────────────────────

  it('returns 201 and the user object on successful registration', async () => {
    const mockUser = { id: 'user-1', email: validBody.email };
    const supabase = makeSupabaseMock({
      data: { user: mockUser as never, session: null },
      error: null,
    });

    const response = await POST(makeContext(makeRequest(validBody), supabase));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.user.id).toBe('user-1');
    expect(body.data.user.email).toBe(validBody.email);
  });

  it('calls signUp with display_name in options.data', async () => {
    const mockUser = { id: 'user-1', email: validBody.email };
    const supabase = makeSupabaseMock({
      data: { user: mockUser as never, session: null },
      error: null,
    });

    await POST(makeContext(makeRequest(validBody), supabase));

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: validBody.email,
      password: validBody.password,
      options: { data: { display_name: validBody.displayName } },
    });
  });

  // ── Duplicate email ────────────────────────────────────────────────────────

  it('returns 409 when the email is already registered', async () => {
    const supabase = makeSupabaseMock({
      data: { user: null, session: null },
      error: { message: 'User already registered', name: 'AuthError', status: 400 } as never,
    });

    const response = await POST(makeContext(makeRequest(validBody), supabase));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('EMAIL_TAKEN');
    expect(body.error).toBe('Email already in use');
  });

  // ── Weak password — Zod validation ────────────────────────────────────────

  it('returns 422 when password is shorter than 8 characters', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = makeRequest({ ...validBody, password: 'Sh0rt' });

    const response = await POST(makeContext(request, supabase));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('returns 422 when password has no uppercase letter', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = makeRequest({ ...validBody, password: 'nouppercase1' });

    const response = await POST(makeContext(request, supabase));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when password has no digit', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = makeRequest({ ...validBody, password: 'NoDigitsHere' });

    const response = await POST(makeContext(request, supabase));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 for an invalid email address', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = makeRequest({ ...validBody, email: 'not-an-email' });

    const response = await POST(makeContext(request, supabase));

    expect(response.status).toBe(422);
  });

  it('returns 422 when displayName is too short', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = makeRequest({ ...validBody, displayName: 'X' });

    const response = await POST(makeContext(request, supabase));

    expect(response.status).toBe(422);
  });

  // ── Malformed body ─────────────────────────────────────────────────────────

  it('returns 400 when the request body is not valid JSON', async () => {
    const supabase = makeSupabaseMock({ data: { user: null, session: null }, error: null });
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{{',
    });

    const response = await POST(makeContext(request, supabase));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_JSON');
  });

  // ── Email confirmation pending ─────────────────────────────────────────────

  it('returns 202 when Supabase requires email confirmation (user is null)', async () => {
    const supabase = makeSupabaseMock({
      data: { user: null, session: null },
      error: null,
    });

    const response = await POST(makeContext(makeRequest(validBody), supabase));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.code).toBe('EMAIL_CONFIRMATION_REQUIRED');
  });

  // ── Generic auth error ─────────────────────────────────────────────────────

  it('returns 400 for unexpected Supabase errors', async () => {
    const supabase = makeSupabaseMock({
      data: { user: null, session: null },
      error: { message: 'Service unavailable', name: 'AuthError', status: 503 } as never,
    });

    const response = await POST(makeContext(makeRequest(validBody), supabase));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('AUTH_ERROR');
  });
});
