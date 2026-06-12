/**
 * Shared API response helpers — eliminate boilerplate in every endpoint.
 *
 * Usage:
 *   return ok({ data: prompt });
 *   return error('Validation failed', 422);
 *   return unauthorized();
 *   return forbidden();
 *   return notFound('Prompt not found');
 */

const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };

export function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data }), { status, headers: JSON_HEADERS });
}

export function created<T>(data: T): Response {
  return ok(data, 201);
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function error(message: string, status = 500, code?: string): Response {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401, 'UNAUTHORIZED');
}

export function forbidden(message = 'Forbidden'): Response {
  return error(message, 403, 'FORBIDDEN');
}

export function notFound(message = 'Not found'): Response {
  return error(message, 404, 'NOT_FOUND');
}

export function validationError(message: string): Response {
  return error(message, 422, 'VALIDATION_ERROR');
}

export function tooManyRequests(message = 'Rate limit exceeded', resetAt?: number): Response {
  const body: { error: string; resetAt?: number } = { error: message };
  if (resetAt) body.resetAt = resetAt;
  const headers: HeadersInit = {
    ...JSON_HEADERS,
    ...(resetAt && { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) }),
  };
  return new Response(JSON.stringify(body), { status: 429, headers });
}
