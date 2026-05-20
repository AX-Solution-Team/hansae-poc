import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    await requireRole(cookieStore, 'ADMIN')

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        teamId: true,
        team: { select: { id: true, name: true } },
        createdAt: true,
        _count: {
          select: {
            agents: true,
            jobs: true,
          },
        },
      },
    })

    return apiSuccess({ items: users })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'ADMIN role required', 403)
    }
    console.error('Admin users error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list users', 500)
  }
}
