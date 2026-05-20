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

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (agent.ownerId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Only the owner can submit for approval', 403)
    }

    if (agent.status !== 'DRAFT') {
      return apiError('CONFLICT', 'Only DRAFT agents can be submitted for approval', 409)
    }

    // Check for existing PENDING approval
    const existingPending = await prisma.approvalRequest.findFirst({
      where: { agentId: id, decision: 'PENDING' },
    })
    if (existingPending) {
      return apiError('CONFLICT', 'There is already a pending approval request', 409)
    }

    const latestVersion = agent.versions[0]
    if (!latestVersion) {
      return apiError('CONFLICT', 'Agent has no versions', 409)
    }

    // Transition: DRAFT → VALIDATING → PENDING_APPROVAL
    await prisma.agent.update({
      where: { id },
      data: { status: 'VALIDATING' },
    })

    // Simulate validation (instant for prototype)
    await prisma.agent.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    })

    // Create ApprovalRequest
    const approval = await prisma.approvalRequest.create({
      data: {
        agentId: id,
        versionId: latestVersion.id,
        requesterId: user.id,
        decision: 'PENDING',
      },
    })

    // Update version status
    await prisma.agentVersion.update({
      where: { id: latestVersion.id },
      data: { status: 'PENDING_APPROVAL' },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        eventType: 'AGENT_SUBMITTED',
        userId: user.id,
        agentId: id,
        payload: JSON.stringify({ versionId: latestVersion.id, approvalId: approval.id }),
      },
    })

    return apiSuccess({
      message: 'Agent submitted for approval',
      approvalId: approval.id,
      status: 'PENDING_APPROVAL',
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Validate error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to submit for approval', 500)
  }
}
