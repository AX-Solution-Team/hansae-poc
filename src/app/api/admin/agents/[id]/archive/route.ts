import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireRole(cookieStore, 'ADMIN')
    const { id } = params

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (agent.status === 'ARCHIVED') {
      return apiError('CONFLICT', 'Agent is already archived', 409)
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        eventType: 'AGENT_ARCHIVED',
        userId: user.id,
        agentId: id,
        payload: JSON.stringify({ previousStatus: agent.status }),
      },
    })

    return apiSuccess({
      message: 'Agent archived',
      agent: updated,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'ADMIN role required', 403)
    }
    console.error('Archive agent error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to archive agent', 500)
  }
}
