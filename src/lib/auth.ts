import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

/* ------------------------------------------------------------------ */
/*  Session shape                                                      */
/* ------------------------------------------------------------------ */

export interface SessionUser {
  id: string
  email: string
  displayName: string
  role: string      // USER | CREATOR | APPROVER | ADMIN
  teamId: string
}

export interface SessionData {
  user?: SessionUser
}

/* ------------------------------------------------------------------ */
/*  Session options                                                    */
/* ------------------------------------------------------------------ */

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'complex_password_at_least_32_characters_long_for_dev_only'

export const sessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'hansae-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
}

/* ------------------------------------------------------------------ */
/*  Role hierarchy                                                     */
/* ------------------------------------------------------------------ */

const ROLE_LEVELS: Record<string, number> = {
  USER: 0,
  CREATOR: 1,
  APPROVER: 2,
  ADMIN: 3,
}

export function roleLevel(role: string): number {
  return ROLE_LEVELS[role] ?? 0
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Get session from Next.js `cookies()` — call inside Server Components / Route Handlers.
 */
export async function getSessionFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Shorthand: resolves cookies() automatically.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getSessionFromCookies(cookieStore)
}

/**
 * Throws if the user is not authenticated.
 * Returns the session user on success.
 */
export async function requireAuth(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<SessionUser> {
  const session = await getSessionFromCookies(cookieStore)
  if (!session.user) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user
}

/**
 * Throws if the user does not meet the minimum role.
 * Returns the session user on success.
 */
export async function requireRole(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  minimumRole: string,
): Promise<SessionUser> {
  const user = await requireAuth(cookieStore)
  if (roleLevel(user.role) < roleLevel(minimumRole)) {
    throw new Error('FORBIDDEN')
  }
  return user
}
