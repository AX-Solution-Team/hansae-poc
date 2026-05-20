/* ------------------------------------------------------------------ */
/*  Standard API response helpers                                      */
/* ------------------------------------------------------------------ */

export function apiSuccess<T>(data: T) {
  return Response.json({ data })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: { field?: string; message: string }[],
) {
  return Response.json(
    { error: { code, message, details } },
    { status },
  )
}
