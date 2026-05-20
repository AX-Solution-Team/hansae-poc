import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)
    const { id } = params

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        team: { select: { id: true, name: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { artifacts: true },
        },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            requester: { select: { id: true, displayName: true } },
            approver: { select: { id: true, displayName: true } },
          },
        },
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    return apiSuccess({
      ...agent,
      tags: JSON.parse(agent.tags || '[]'),
      inputsSchema: JSON.parse(agent.inputsSchema || '[]'),
      outputsSchema: JSON.parse(agent.outputsSchema || '[]'),
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Agent detail error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to get agent', 500)
  }
}

export async function PATCH(
  request: NextRequest,
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

    // Only owner or ADMIN can edit
    if (agent.ownerId !== user.id && user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'You can only edit your own agents', 403)
    }

    // Only DRAFT or REJECTED agents can be edited
    if (agent.status !== 'DRAFT' && agent.status !== 'REJECTED') {
      return apiError('CONFLICT', 'Only DRAFT or REJECTED agents can be edited', 409)
    }

    const body = await request.json()
    const {
      name,
      description,
      agentGroup,
      runtimeType,
      dataClassification,
      tags,
      inputsSchema,
      outputsSchema,
      workflowJson,
      executorKey,
      department,
      asIsSummary,
      toBeSummary,
      workflowMd,
      demoRunnable,
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (agentGroup !== undefined) updateData.agentGroup = agentGroup
    if (runtimeType !== undefined) updateData.runtimeType = runtimeType
    if (dataClassification !== undefined) updateData.dataClassification = dataClassification
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)
    if (inputsSchema !== undefined) updateData.inputsSchema = JSON.stringify(inputsSchema)
    if (outputsSchema !== undefined) updateData.outputsSchema = JSON.stringify(outputsSchema)
    if (workflowJson !== undefined) updateData.workflowJson = JSON.stringify(workflowJson)
    if (executorKey !== undefined) updateData.executorKey = executorKey
    if (department !== undefined) updateData.department = department
    if (asIsSummary !== undefined) updateData.asIsSummary = asIsSummary
    if (toBeSummary !== undefined) updateData.toBeSummary = toBeSummary
    if (workflowMd !== undefined) updateData.workflowMd = workflowMd
    if (demoRunnable !== undefined) updateData.demoRunnable = demoRunnable

    const updated = await prisma.agent.update({
      where: { id },
      data: updateData,
    })

    return apiSuccess({
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
      inputsSchema: JSON.parse(updated.inputsSchema || '[]'),
      outputsSchema: JSON.parse(updated.outputsSchema || '[]'),
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('Update agent error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to update agent', 500)
  }
}
