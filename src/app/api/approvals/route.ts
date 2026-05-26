import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const user = await requireRole(cookieStore, 'APPROVER')

    const { searchParams } = request.nextUrl
    const decision = searchParams.get('decision') ?? ''

    const where: Record<string, unknown> = {
      agent: { teamId: user.teamId },
    }
    if (decision) {
      where.decision = decision
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            agentGroup: true,
            buildTier: true,
            status: true,
          },
        },
        version: { select: { id: true, version: true } },
        requester: { select: { id: true, displayName: true, email: true } },
        approver: { select: { id: true, displayName: true } },
      },
    })

    const items = approvals.map((a) => ({
      id: a.id,
      agentId: a.agent.id,
      agentName: a.agent.name,
      agentGroup: a.agent.agentGroup,
      agentDescription: a.agent.description ?? '',
      buildTier: a.agent.buildTier,
      requesterName: a.requester.displayName,
      requesterId: a.requester.id,
      requestedAt: a.createdAt,
      decision: a.decision,
    }))

    return apiSuccess({ items })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'APPROVER role required', 403)
    }
    console.error('List approvals error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to list approvals', 500)
  }
}
