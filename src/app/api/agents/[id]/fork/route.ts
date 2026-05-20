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
    const user = await requireRole(cookieStore, 'CREATOR')
    const { id } = params

    const source = await prisma.agent.findUnique({ where: { id } })
    if (!source) {
      return apiError('NOT_FOUND', 'Agent not found', 404)
    }

    if (source.status !== 'PUBLISHED') {
      return apiError('CONFLICT', 'Only PUBLISHED agents can be forked', 409)
    }

    // Generate unique slug
    const baseSlug = `${source.slug}-fork`
    let forkSlug = baseSlug
    let counter = 1
    while (await prisma.agent.findUnique({ where: { slug: forkSlug } })) {
      forkSlug = `${baseSlug}-${counter}`
      counter++
    }

    const forked = await prisma.agent.create({
      data: {
        slug: forkSlug,
        name: `${source.name} (Fork)`,
        description: source.description,
        agentGroup: source.agentGroup,
        buildTier: source.buildTier,
        runtimeType: source.runtimeType,
        dataClassification: source.dataClassification,
        status: 'DRAFT',
        demoRunnable: source.demoRunnable,
        tags: source.tags,
        inputsSchema: source.inputsSchema,
        outputsSchema: source.outputsSchema,
        templateId: source.templateId,
        workflowJson: source.workflowJson,
        executorKey: source.executorKey,
        department: source.department,
        asIsSummary: source.asIsSummary,
        toBeSummary: source.toBeSummary,
        workflowMd: source.workflowMd,
        ownerId: user.id,
        teamId: user.teamId,
        forkedFromId: source.id,
      },
    })

    // Create initial version for fork
    await prisma.agentVersion.create({
      data: {
        agentId: forked.id,
        version: '0.1.0',
        changelog: `Forked from ${source.slug}`,
        status: 'DRAFT',
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        eventType: 'AGENT_FORKED',
        userId: user.id,
        agentId: forked.id,
        payload: JSON.stringify({ sourceId: source.id, sourceSlug: source.slug }),
      },
    })

    return apiSuccess(forked)
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'CREATOR role required', 403)
    }
    console.error('Fork agent error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to fork agent', 500)
  }
}
