import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { slug } = params

    const agent = await prisma.agent.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, displayName: true } },
        team: { select: { id: true, name: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { artifacts: true },
        },
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    const { favorites, team, ...rest } = agent
    return apiSuccess({
      ...rest,
      tags: JSON.parse(agent.tags || '[]'),
      inputsSchema: JSON.parse(agent.inputsSchema || '[]'),
      outputsSchema: JSON.parse(agent.outputsSchema || '[]'),
      isFavorite: favorites.length > 0,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Marketplace detail error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get agent detail', 500)
  }
}
