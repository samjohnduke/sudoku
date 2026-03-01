/**
 * Consistent API response helpers.
 * All error responses follow { error: string } format.
 * All success responses follow { ok: true, ...data } format.
 */

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess(data: Record<string, unknown> = {}) {
  return Response.json({ ok: true, ...data });
}
