import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  _request: NextRequest,
  { params }: { params: { agentId: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { agentId } = params

    // Check agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } })
    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    // Upsert favorite (ignore if already exists)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_agentId: { userId: user.id, agentId },
      },
      create: { userId: user.id, agentId },
      update: {},
    })

    return apiSuccess({ favorite, message: 'Added to favorites' })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Add favorite error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to add favorite', 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { agentId: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { agentId } = params

    await prisma.favorite.deleteMany({
      where: { userId: user.id, agentId },
    })

    return apiSuccess({ message: 'Removed from favorites' })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Remove favorite error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to remove favorite', 500)
  }
}
