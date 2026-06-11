/**
 * Zod validation helpers for API routes.
 *
 * Usage:
 *   const result = await parseBody(request, MySchema);
 *   if (result instanceof Response) return result;
 *   const { title } = result; // fully typed
 *
 *   const qResult = parseQuery(url, QuerySchema);
 *   if (qResult instanceof Response) return qResult;
 */

import { z } from 'zod';
import { error, validationError } from './response';

/** Parse and validate JSON request body. Returns typed data or a Response. */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON', 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return validationError(result.error.issues[0]?.message ?? 'Validation error');
  }

  return result.data as z.infer<T>;
}

/** Parse and validate URL search params. Returns typed data or a Response. */
export function parseQuery<T extends z.ZodTypeAny>(
  url: URL,
  schema: T,
): z.infer<T> | Response {
  const result = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!result.success) {
    return validationError(result.error.issues[0]?.message ?? 'Invalid query parameters');
  }
  return result.data as z.infer<T>;
}
