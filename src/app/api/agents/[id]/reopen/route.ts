import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireAuth(cookieStore)
    const { id } = params

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (agent.ownerId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Only the owner can reopen this agent', 403)
    }

    if (agent.status !== 'REJECTED') {
      return apiError('CONFLICT', 'Only REJECTED agents can be reopened', 409)
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: { status: 'DRAFT' },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        eventType: 'AGENT_REOPENED',
        userId: user.id,
        agentId: id,
      },
    })

    return apiSuccess({
      message: 'Agent reopened as DRAFT',
      agent: updated,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Reopen error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to reopen agent', 500)
  }
}
