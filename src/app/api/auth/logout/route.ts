import { cookies } from 'next/headers'
import { getSessionFromCookies } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const session = await getSessionFromCookies(cookieStore)
    session.destroy()
    return apiSuccess({ message: 'Logged out' })
  } catch (err) {
    console.error('Logout error:', err)
    return apiError('INTERNAL_ERROR', 'Logout failed', 500)
  }
}
