import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)

    const agents = await prisma.agent.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        team: { select: { id: true, name: true } },
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    const items = agents.map((a) => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
    }))

    return apiSuccess({ items })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('My agents error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list agents', 500)
  }
}
