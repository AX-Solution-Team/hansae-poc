import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    const user = await requireRole(cookieStore, 'APPROVER')
    const { id } = params

    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
      include: { agent: true },
    })

    if (!approval) {
      return apiError('NOT_FOUND', 'Approval request not found', 404)
    }

    if (approval.decision !== 'PENDING') {
      return apiError('CONFLICT', 'This request has already been decided', 409)
    }

    // Ensure approver is in the same team
    if (approval.agent.teamId !== user.teamId && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'You can only reject agents in your team', 403)
    }

    const body = await request.json()
    const comment = body.comment

    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return apiError('VALIDATION_ERROR', 'Rejection comment is required (minimum 5 characters)', 400)
    }

    // Update ApprovalRequest
    await prisma.approvalRequest.update({
      where: { id },
      data: {
        decision: 'REJECTED',
        approverId: user.id,
        comment: comment.trim(),
        decidedAt: new Date(),
      },
    })

    // Update Agent status
    await prisma.agent.update({
      where: { id: approval.agentId },
      data: { status: 'REJECTED' },
    })

    // Update version status
    await prisma.agentVersion.update({
      where: { id: approval.versionId },
      data: { status: 'REJECTED' },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        eventType: 'AGENT_REJECTED',
        userId: user.id,
        agentId: approval.agentId,
        payload: JSON.stringify({
          approvalId: id,
          versionId: approval.versionId,
          comment: comment.trim(),
        }),
      },
    })

    return apiSuccess({
      message: 'Agent rejected',
      approvalId: id,
      agentId: approval.agentId,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'APPROVER role required', 403)
    }
    console.error('Reject error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to reject', 500)
  }
}
