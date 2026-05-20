import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    return apiSuccess({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Me error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get user', 500)
  }
}
